const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const c = require('../controllers/adminController');

// All routes require authentication + admin role
router.use(protect, admin);

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
router.get('/dashboard', c.getDashboardMetrics);
router.get('/dashboard/chart', c.getDashboardChart);

// ─── USERS ────────────────────────────────────────────────────────────────────
router.get('/users',                   c.getAllUsers);
router.post('/users',                  c.createUser);
router.patch('/users/:id',             c.updateUser);
router.patch('/users/:id/status',      c.updateUserStatus);
router.patch('/users/:id/role',        c.updateUserRole);
router.delete('/users/:id/force-delete', c.forceDeleteAccount);
router.post('/users/:id/warn',         c.warnUser);
router.get('/users/:id/warnings',     c.getUserWarnings);
router.get('/users/:id/history',      c.getModerationHistory);
router.get('/users/:id/bookings',     c.getUserBookings);

// ─── CAMPS ────────────────────────────────────────────────────────────────────
router.get('/camps',                   c.getCamps);
router.patch('/camps/:id',             c.updateCamp);
router.patch('/camps/:id/status',      c.updateCampStatus);
router.post('/camps/:id/warn',         c.warnCamp);

// ─── KYC ──────────────────────────────────────────────────────────────────────
router.get('/kyc',                     c.getKYCQueue);
router.patch('/kyc/:id',               c.updateKYC);

// ─── FINANCIAL ────────────────────────────────────────────────────────────────
router.get('/financial/transactions',  c.getTransactions);
router.get('/financial/payouts',       c.getPayouts);
router.get('/financial/analytics',     c.getFinancialAnalytics);
router.post('/financial/refund',       c.processRefund);


// ─── FEATURES ─────────────────────────────────────────────────────────────────
router.get('/features',                c.getFeatures);
router.patch('/features',              c.updateFeatures);

// ─── LOGS ─────────────────────────────────────────────────────────────────────
router.get('/logs',                    c.getLogs);

// ─── ALERTS / REPORTS ─────────────────────────────────────────────────────────
router.get('/alerts/history',          c.getAlertHistory);
router.post('/alerts/send',            c.sendAlert);
router.get('/system-metrics',          c.getSystemMetrics);
router.post('/reports/generate',       c.generateReport);

// ─── SECURITY ─────────────────────────────────────────────────────────────────
router.get('/security/blocked-ips',          c.getBlockedIPs);
router.post('/security/blocked-ips',         c.blockIP);
router.delete('/security/blocked-ips/:ip',   c.unblockIP);

router.get('/security/incidents',            c.getSecurityIncidents);
router.patch('/security/incidents/:id',      c.resolveIncident);

router.get('/security/scans',                c.getVulnerabilityScans);
router.post('/security/scans',               c.scheduleVulnerabilityScan);

router.get('/security/policy',               c.getSecurityPolicy);
router.patch('/security/policy',             c.saveSecurityPolicy);

// ─── ALERTS ───────────────────────────────────────────────────────────────────
router.get('/alerts/history',                c.getAlertHistory);
router.post('/alerts/send',                  c.sendAlert);

// ─── DATABASE ─────────────────────────────────────────────────────────────────
router.get('/db/slow-queries',     c.getSlowQueries);
router.get('/db/indexes',          c.getIndexes);
router.post('/db/indexes',         c.createIndex);
router.post('/db/indexes/:name/rebuild', c.rebuildIndex);
router.get('/db/migrations',       c.getMigrations);
router.post('/db/migrations',      c.runMigration);
router.get('/db/table-stats',      c.getTableStats);
router.get('/db/overview',         c.getDbOverview);
router.get('/db/maintenance',      c.getDbMaintenance);
router.post('/db/optimize-query',  c.optimizeQuery);
router.post('/db/archive',         c.archiveData);
router.post('/db/integrity-check', c.checkIntegrity);
router.post('/db/vacuum',          c.runVacuum);

// ─── BACKUPS ──────────────────────────────────────────────────────────────────
// NOTE: specific paths MUST come before parameterized /:id routes
router.get('/backups/tests',           c.getBackupTests);
router.get('/backups/overview',        c.getBackupOverview);
router.get('/backups',                 c.getBackups);
router.post('/backups/full',           c.runFullBackup);
router.post('/backups/test-restore',   c.scheduleTestRestore);
router.post('/backups/point-in-time',  (req, res) => res.json({ success: true, data: { initiated: true } }));
router.post('/backups/dr-drill',       (req, res) => res.json({ success: true, data: { initiated: true } }));
router.post('/backups/:id/restore',    (req, res) => res.json({ success: true, data: { queued: true } }));

// ─── CONFIGURATION & FEATURES ───────────────────────────────────────────────
router.get('/config',                  c.getSystemConfigs);
router.patch('/config/:key',           c.updateSystemConfig);

module.exports = router;
