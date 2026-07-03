import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { query, withTransaction } from '../db/pool.js';
import { notifyUser } from '../utils/notify.js';
import { streamInvoicePdf } from '../utils/invoice.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

function serializeOrder(row, items = [], address = null) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    invoiceNumber: row.invoice_number,
    customer: row.customer_name,
    customerEmail: row.customer_email,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method || 'cod',
    notes: row.notes || '',
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.shipping_fee),
    taxLabel: row.tax_label,
    taxRatePercent: Number(row.tax_rate_percent || 0),
    taxAmount: Number(row.tax_amount || 0),
    total: Number(row.total),
    createdAt: row.created_at,
    shippingAddress: address ? {
      id: address.id,
      label: address.label,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postal_code,
      country: address.country,
      phone: address.phone,
    } : null,
    items: items.map((i) => ({
      productId: i.product_id,
      name: i.product_name,
      color: i.color,
      size: i.size,
      qty: i.qty,
      price: Number(i.price),
    })),
  };
}

function generateOrderNumber() {
  const n = Math.floor(10000 + Math.random() * 89999);
  return `ORD-${n}`;
}

// Public — lets the storefront Cart/Checkout UI show an accurate tax line
// before the order is actually placed. Only the fields needed for display
// are exposed; the rest of company_settings stays admin-only.
router.get('/tax-rate', asyncHandler(async (req, res) => {
  const result = await query('SELECT tax_label, tax_rate_percent, tax_inclusive FROM company_settings WHERE id = 1');
  const row = result.rows[0] || { tax_label: 'Sales Tax', tax_rate_percent: 0, tax_inclusive: false };
  res.json({
    label: row.tax_label || 'Sales Tax',
    ratePercent: Number(row.tax_rate_percent || 0),
    inclusive: row.tax_inclusive,
  });
}));

// Checkout: convert current cart into an order
router.post('/checkout', requireAuth, asyncHandler(async (req, res) => {
  const { addressId, notes, paymentMethod } = req.body;
  const validPaymentMethods = ['cod', 'card', 'upi'];
  const method = validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'cod';

  const order = await withTransaction(async (client) => {
    if (!addressId) {
      const err = new Error('Please select a shipping address');
      err.status = 400;
      throw err;
    }
    const addressRes = await client.query(
      'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
      [addressId, req.user.id]
    );
    if (addressRes.rows.length === 0) {
      const err = new Error('Shipping address not found');
      err.status = 400;
      throw err;
    }
    const address = addressRes.rows[0];

    const cartRes = await client.query(
      `SELECT ci.*, p.name AS product_name, p.price AS current_price, p.stock
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = $1 FOR UPDATE`,
      [req.user.id]
    );

    if (cartRes.rows.length === 0) {
      const err = new Error('Cart is empty');
      err.status = 400;
      throw err;
    }

    for (const item of cartRes.rows) {
      if (item.qty > item.stock) {
        const err = new Error(`Insufficient stock for ${item.product_name}`);
        err.status = 409;
        throw err;
      }
    }

    const subtotal = cartRes.rows.reduce((sum, i) => sum + Number(i.current_price) * i.qty, 0);
    const shippingFee = 0; // free shipping storewide, per storefront promo

    const settingsRes = await client.query('SELECT tax_label, tax_rate_percent, tax_inclusive, invoice_prefix FROM company_settings WHERE id = 1');
    const taxSettings = settingsRes.rows[0] || { tax_label: 'Sales Tax', tax_rate_percent: 0, tax_inclusive: false, invoice_prefix: 'INV' };
    const taxRate = Number(taxSettings.tax_rate_percent || 0);
    // Tax-inclusive pricing means the displayed price already contains tax,
    // so we back the tax amount out instead of adding it on top.
    const taxAmount = taxSettings.tax_inclusive
      ? subtotal - subtotal / (1 + taxRate / 100)
      : (subtotal + shippingFee) * (taxRate / 100);
    const total = taxSettings.tax_inclusive ? subtotal + shippingFee : subtotal + shippingFee + taxAmount;

    const orderNumber = generateOrderNumber();
    const invoiceNumber = `${taxSettings.invoice_prefix || 'INV'}-${orderNumber.replace('ORD-', '')}`;

    const orderRes = await client.query(
      `INSERT INTO orders (order_number, user_id, subtotal, shipping_fee, total, shipping_address_id, tax_label, tax_rate_percent, tax_amount, invoice_number, notes, payment_method)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [orderNumber, req.user.id, subtotal, shippingFee, total, addressId, taxSettings.tax_label || 'Sales Tax', taxRate, taxAmount, invoiceNumber, notes || null, method]
    );
    const newOrder = orderRes.rows[0];

    for (const item of cartRes.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, color, size, qty, price)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [newOrder.id, item.product_id, item.product_name, item.color, item.size, item.qty, item.current_price]
      );
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.qty, item.product_id]);
    }

    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

    await client.query(
      `INSERT INTO shipments (shipment_no, type, order_id, reference, items_count, status)
       VALUES ($1,'outbound',$2,$3,$4,'ready_to_pack')`,
      [`SHP-${Math.floor(700 + Math.random() * 299)}`, newOrder.id, orderNumber, cartRes.rows.reduce((s, i) => s + i.qty, 0)]
    );

    await client.query(
      `INSERT INTO notifications (user_id, title, body) VALUES ($1,$2,$3)`,
      [req.user.id, 'Order placed', `Your order ${orderNumber} has been placed successfully.`]
    );

    return { newOrder, items: cartRes.rows, address };
  });

  res.status(201).json(serializeOrder(order.newOrder, order.items, order.address));
}));

// Customer's own orders
router.get('/my', requireAuth, asyncHandler(async (req, res) => {
  const orders = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
  const result = [];
  for (const o of orders.rows) {
    const items = await query('SELECT * FROM order_items WHERE order_id = $1', [o.id]);
    const addr = o.shipping_address_id
      ? await query('SELECT * FROM addresses WHERE id = $1', [o.shipping_address_id])
      : { rows: [] };
    result.push(serializeOrder({ ...o, customer_name: req.user.name, customer_email: req.user.email }, items.rows, addr.rows[0] || null));
  }
  res.json(result);
}));

router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const orderRes = await query(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_email FROM orders o
     JOIN users u ON u.id = o.user_id WHERE o.id = $1`,
    [req.params.id]
  );
  const order = orderRes.rows[0];
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.user_id !== req.user.id && !['admin', 'support', 'warehouse'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const items = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
  const addr = order.shipping_address_id
    ? await query('SELECT * FROM addresses WHERE id = $1', [order.shipping_address_id])
    : { rows: [] };
  res.json(serializeOrder(order, items.rows, addr.rows[0] || null));
}));

// Admin / warehouse: list all orders
router.get('/', requireAuth, requireRole('admin', 'warehouse', 'support'), asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const conditions = [];
  const params = [];
  if (status) {
    params.push(status);
    conditions.push(`o.status = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const result = await query(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_email FROM orders o
     JOIN users u ON u.id = o.user_id ${where}
     ORDER BY o.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json(result.rows.map((o) => serializeOrder(o)));
}));

router.patch('/:id/status', requireAuth, requireRole('admin', 'warehouse'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: `status must be one of ${valid.join(', ')}` });
  const result = await query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Order not found' });
  const order = result.rows[0];
  await notifyUser(order.user_id, 'Order update', `Your order ${order.order_number} is now ${status}.`);
  await logAudit(req, { action: 'order.status_change', entityType: 'order', entityId: order.id, details: { status } });
  res.json(serializeOrder(order));
}));

router.patch('/:id/payment', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { paymentStatus } = req.body;
  const valid = ['unpaid', 'paid', 'refunded'];
  if (!valid.includes(paymentStatus)) return res.status(400).json({ error: `paymentStatus must be one of ${valid.join(', ')}` });
  const result = await query('UPDATE orders SET payment_status = $1 WHERE id = $2 RETURNING *', [paymentStatus, req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Order not found' });
  await logAudit(req, { action: 'order.payment_change', entityType: 'order', entityId: result.rows[0].id, details: { paymentStatus } });
  res.json(serializeOrder(result.rows[0]));
}));

// Download a PDF invoice for an order — the customer who owns the order,
// or staff (admin/support/warehouse), can access it.
router.get('/:id/invoice', requireAuth, asyncHandler(async (req, res) => {
  const orderRes = await query(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_email FROM orders o
     JOIN users u ON u.id = o.user_id WHERE o.id = $1`,
    [req.params.id]
  );
  const order = orderRes.rows[0];
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.user_id !== req.user.id && !['admin', 'support', 'warehouse'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const items = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
  const companyRes = await query('SELECT * FROM company_settings WHERE id = 1');

  streamInvoicePdf(res, {
    order: serializeOrder(order),
    items: items.rows.map((i) => ({ name: i.product_name, color: i.color, size: i.size, qty: i.qty, price: Number(i.price) })),
    company: companyRes.rows[0],
  });
}));

export default router;
