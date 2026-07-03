import dotenv from 'dotenv';
import cron from 'node-cron';
import app from './app.js';
import { pool, query } from './db/pool.js';
import { runScheduledBackup } from './utils/backup.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

// Map the human-readable frequency stored in company_settings to a cron
// expression so the Admin UI "Backup frequency" dropdown actually
// changes the schedule at runtime.
const FREQUENCY_TO_CRON = {
  hourly:  '0 * * * *',
  daily:   '0 2 * * *',
  weekly:  '0 2 * * 0',
  monthly: '0 2 1 * *',
};

let backupTask = null;

/**
 * (Re)schedules the automatic backup cron job.
 * Called once at startup, and again whenever an Admin changes the
 * backup frequency via the dashboard.
 */
export async function rescheduleBackup() {
  // Priority: BACKUP_CRON env var → DB frequency → hardcoded daily default
  let expression = process.env.BACKUP_CRON;

  if (!expression) {
    try {
      const settingsRes = await query('SELECT backup_frequency FROM company_settings WHERE id = 1');
      const freq = settingsRes.rows[0]?.backup_frequency;
      expression = FREQUENCY_TO_CRON[freq] || FREQUENCY_TO_CRON.daily;
    } catch {
      expression = FREQUENCY_TO_CRON.daily;
    }
  }

  if (!cron.validate(expression)) {
    console.warn(`[backup] Invalid cron expression "${expression}", falling back to daily.`);
    expression = FREQUENCY_TO_CRON.daily;
  }

  if (backupTask) backupTask.stop();
  backupTask = cron.schedule(expression, () => { runScheduledBackup(); });
  console.log(`[backup] Automatic backup scheduled (cron: "${expression}")`);
  return expression;
}

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection successful.');
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`The Kour backend running on http://localhost:${PORT}`);
  });

  await rescheduleBackup();
}

start();

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
