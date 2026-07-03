import PDFDocument from 'pdfkit';

/**
 * Streams a one-page PDF invoice for an order straight to an HTTP
 * response. `order` and `items` use the same shape as serializeOrder(),
 * `company` is the company_settings row (for name/address/tax id).
 */
export function streamInvoicePdf(res, { order, items, company }) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${order.invoiceNumber || order.orderNumber}.pdf"`);
  doc.pipe(res);

  // Header
  doc.fontSize(20).text(company?.company_name || 'The Kour', { continued: false });
  doc.fontSize(10).fillColor('#555')
    .text(company?.address_line1 || '')
    .text([company?.city, company?.state, company?.postal_code].filter(Boolean).join(', '))
    .text(company?.contact_email || '')
    .text(company?.tax_id ? `Tax ID: ${company.tax_id}` : '');

  doc.moveDown(1.5);
  doc.fillColor('#000').fontSize(16).text('INVOICE', { align: 'right' });
  doc.fontSize(10).fillColor('#333')
    .text(`Invoice #: ${order.invoiceNumber || '-'}`, { align: 'right' })
    .text(`Order #: ${order.orderNumber}`, { align: 'right' })
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'right' });

  doc.moveDown(1);
  doc.fontSize(11).fillColor('#000').text('Billed to:');
  doc.fontSize(10).fillColor('#333').text(order.customer || '').text(order.customerEmail || '');

  doc.moveDown(1.5);

  // Table header
  const tableTop = doc.y;
  const cols = { name: 50, qty: 300, price: 360, total: 450 };
  doc.fontSize(10).fillColor('#000');
  doc.text('Item', cols.name, tableTop);
  doc.text('Qty', cols.qty, tableTop);
  doc.text('Price', cols.price, tableTop);
  doc.text('Total', cols.total, tableTop);
  doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor('#ccc').stroke();

  let y = tableTop + 22;
  doc.fontSize(10).fillColor('#333');
  for (const item of items) {
    const lineTotal = item.qty * item.price;
    doc.text(`${item.name}${item.color ? ` (${item.color}` : ''}${item.size ? `${item.color ? ', ' : ' ('}${item.size})` : item.color ? ')' : ''}`, cols.name, y, { width: 240 });
    doc.text(String(item.qty), cols.qty, y);
    doc.text(`$${item.price.toFixed(2)}`, cols.price, y);
    doc.text(`$${lineTotal.toFixed(2)}`, cols.total, y);
    y += 20;
  }

  doc.moveTo(50, y + 5).lineTo(545, y + 5).strokeColor('#ccc').stroke();
  y += 15;

  const summaryLine = (label, value, bold = false) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10).fillColor('#000');
    doc.text(label, cols.price, y);
    doc.text(value, cols.total, y);
    y += 18;
  };
  summaryLine('Subtotal', `$${order.subtotal.toFixed(2)}`);
  summaryLine('Shipping', `$${order.shippingFee.toFixed(2)}`);
  summaryLine(`${order.taxLabel || 'Tax'} (${order.taxRatePercent}%)`, `$${order.taxAmount.toFixed(2)}`);
  summaryLine('Total', `$${order.total.toFixed(2)}`, true);

  if (company?.invoice_notes) {
    doc.moveDown(2);
    doc.font('Helvetica').fontSize(9).fillColor('#666').text(company.invoice_notes, 50, doc.y, { width: 495 });
  }

  doc.end();
}
