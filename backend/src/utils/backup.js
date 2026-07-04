import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import { query } from '../db/pool.js';
import { sendNotificationEmail } from './mailer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const BACKUP_DIR = path.join(__dirname, '../../backups');

// if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

/**
 * Builds an .xlsx workbook with two sheets — Orders and Stock — and saves
 * it to disk. Returns { fileName, filePath, ordersCount, productsCount }.
 */
export async function runBackup({ triggeredBy = 'auto' } = {}) {

  // Disable backups on Vercel
  if (process.env.VERCEL) {
    return {
      fileName: null,
      filePath: null,
      ordersCount: 0,
      productsCount: 0,
    };
  }

export async function runBackup({ triggeredBy = 'auto' } = {}) {
  const ordersRes = await query(
    `SELECT o.order_number, u.name AS customer_name, u.email AS customer_email,
            o.status, o.payment_status, o.subtotal, o.shipping_fee, o.tax_amount,
            o.total, o.created_at
     FROM orders o JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC`
  );
  const stockRes = await query(
    `SELECT sku, name, category_id, price, stock, low_stock_threshold, warehouse, is_active, updated_at
     FROM products ORDER BY name ASC`
  );

  const ordersSheet = ordersRes.rows.map((o) => ({
    'Order Number': o.order_number,
    Customer: o.customer_name,
    Email: o.customer_email,
    Status: o.status,
    'Payment Status': o.payment_status,
    Subtotal: Number(o.subtotal),
    'Shipping Fee': Number(o.shipping_fee),
    Tax: Number(o.tax_amount || 0),
    Total: Number(o.total),
    'Created At': o.created_at ? new Date(o.created_at).toISOString() : '',
  }));

  const stockSheet = stockRes.rows.map((p) => ({
    SKU: p.sku,
    Name: p.name,
    Category: p.category_id,
    Price: Number(p.price),
    Stock: p.stock,
    'Low Stock Threshold': p.low_stock_threshold,
    Warehouse: p.warehouse,
    Active: p.is_active ? 'Yes' : 'No',
    'Updated At': p.updated_at ? new Date(p.updated_at).toISOString() : '',
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(ordersSheet), 'Orders');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(stockSheet), 'Stock');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `backup-${timestamp}.xlsx`;
  const filePath = path.join(BACKUP_DIR, fileName);
  XLSX.writeFile(workbook, filePath);

  await query(
    `INSERT INTO backup_runs (triggered_by, file_name, orders_count, products_count, status)
     VALUES ($1,$2,$3,$4,'success')`,
    [triggeredBy, fileName, ordersSheet.length, stockSheet.length]
  );
  await query(`UPDATE company_settings SET last_backup_at = now() WHERE id = 1`);

  await enforceRetention();

  return { fileName, filePath, ordersCount: ordersSheet.length, productsCount: stockSheet.length };
}

// Deletes backup files (and their backup_runs rows) older than the
// configured retention window so the backups folder doesn't grow forever.
async function enforceRetention() {
  const settingsRes = await query('SELECT backup_retention_days FROM company_settings WHERE id = 1');
  const retentionDays = settingsRes.rows[0]?.backup_retention_days || 30;

  const oldRuns = await query(
    `SELECT file_name FROM backup_runs WHERE created_at < now() - ($1 || ' days')::interval`,
    [retentionDays]
  );
  for (const run of oldRuns.rows) {
    const filePath = path.join(BACKUP_DIR, run.file_name);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await query(`DELETE FROM backup_runs WHERE created_at < now() - ($1 || ' days')::interval`, [retentionDays]);
}

// Wired into a node-cron job in server.js to run automatically (default:
// every 24 hours). On failure, emails the configured notification
// addresses instead of failing silently.
export async function runScheduledBackup() {

  // Skip backups on Vercel
  if (process.env.VERCEL) {
    return;
  }

  try {
    const result = await runBackup({ triggeredBy: 'auto' });
    console.log(`[backup] Automatic backup complete: ${result.fileName} (${result.ordersCount} orders, ${result.productsCount} products)`);
    return result;
  } catch (err) {
    console.error('[backup] Automatic backup failed:', err.message);
    await query(
      `INSERT INTO backup_runs (triggered_by, file_name, status, error) VALUES ('auto','(failed)','failed',$1)`,
      [err.message]
    ).catch(() => {});
    try {
      const settingsRes = await query('SELECT notification_emails FROM company_settings WHERE id = 1');
      const emails = settingsRes.rows[0]?.notification_emails || [];
      for (const email of emails) {
        await sendNotificationEmail(email, 'Automatic backup failed', `<p>The scheduled orders/stock backup failed: ${err.message}</p>`);
      }
    } catch {
      // best-effort only
    }
  }
}
}
