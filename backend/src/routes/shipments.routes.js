import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = express.Router();

function serializeShipment(row) {
  return {
    id: row.id,
    shipmentNo: row.shipment_no,
    type: row.type,
    order: row.order_number || row.reference,
    items: row.items_count,
    status: row.status,
    warehouse: row.warehouse,
    createdAt: row.created_at,
  };
}

router.get('/', requireAuth, requireRole('admin', 'warehouse'), asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT s.*, o.order_number FROM shipments s LEFT JOIN orders o ON o.id = s.order_id
     ORDER BY s.created_at DESC`
  );
  res.json(result.rows.map(serializeShipment));
}));

router.post('/', requireAuth, requireRole('admin', 'warehouse'), asyncHandler(async (req, res) => {
  const { type = 'inbound', reference, itemsCount = 0, warehouse = 'WH-NewYork' } = req.body;
  const shipmentNo = `SHP-${Math.floor(700 + Math.random() * 299)}`;
  const result = await query(
    `INSERT INTO shipments (shipment_no, type, reference, items_count, warehouse) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [shipmentNo, type, reference || null, itemsCount, warehouse]
  );
  res.status(201).json(serializeShipment(result.rows[0]));
}));

router.patch('/:id/status', requireAuth, requireRole('admin', 'warehouse'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });
  const result = await query('UPDATE shipments SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Shipment not found' });

  // Outbound shipment marked shipped/delivered keeps the linked order in sync
  if (result.rows[0].order_id && ['packed', 'shipped', 'delivered'].includes(status)) {
    const orderStatus = status === 'packed' ? 'processing' : status;
    await query('UPDATE orders SET status = $1 WHERE id = $2', [orderStatus, result.rows[0].order_id]);
  }
  res.json(serializeShipment(result.rows[0]));
}));

export default router;
