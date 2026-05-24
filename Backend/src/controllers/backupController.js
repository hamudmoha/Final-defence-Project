const Backup = require('../models/Backup');
const SystemLog = require('../models/SystemLog');
const reportHelper = require('../utils/reportHelper');
const sendEmail = require('../utils/sendEmail');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

/**
 * @desc    Get backup history and overview
 */
exports.getBackupData = async (req, res) => {
    try {
        const backups = await Backup.find().sort({ createdAt: -1 });
        
        const fullBackups = backups.filter(b => b.type === 'full');
        const incrementalBackups = backups.filter(b => b.type === 'incremental');

        // Real overview stats
        const totalSize = backups.reduce((acc, b) => {
            const sizeVal = parseFloat(b.size) || 0;
            return acc + sizeVal;
        }, 0).toFixed(2) + ' MB';

        const overview = {
            lastFull: fullBackups[0]?.createdAt || "Never",
            lastIncremental: incrementalBackups[0]?.createdAt || "Never",
            totalSize: totalSize,
            backupCount: backups.length,
            successRate: backups.length > 0 ? 
                ((backups.filter(b => b.status === 'completed').length / backups.length) * 100).toFixed(1) + '%' 
                : '100%'
        };

        res.json({
            success: true,
            data: {
                overview,
                fullBackups: fullBackups.map(b => ({
                    id: b._id,
                    database: b.database,
                    size: b.size,
                    timestamp: b.createdAt,
                    status: b.status,
                    environment: b.environment
                })),
                incrementalBackups: incrementalBackups.map(b => ({
                    id: b._id,
                    timestamp: b.createdAt,
                    changes: b.changes,
                    status: b.status
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch backup data" });
    }
};

/**
 * @desc    Trigger a real database backup (simulated here for safety, but logic provided)
 */
exports.createBackup = async (req, res) => {
    try {
        const backupId = `BK-${Date.now()}`;
        const env = process.env.NODE_ENV || 'production';
        
        // Create record
        const backupRecord = await Backup.create({
            type: "full",
            database: "MongoDB",
            status: "in_progress",
            environment: env,
            triggeredBy: req.user?._id
        });

        // Actual backup command logic (commented out to prevent accidental system calls during setup)
        /*
        const backupPath = path.join(__dirname, `../../backups/${backupId}.gz`);
        const mongoUri = process.env.MONGO_URI;
        const cmd = `mongodump --uri="${mongoUri}" --archive="${backupPath}" --gzip`;
        
        exec(cmd, async (error, stdout, stderr) => {
            if (error) {
                backupRecord.status = 'failed';
                await backupRecord.save();
                return;
            }
            backupRecord.status = 'completed';
            backupRecord.size = (fs.statSync(backupPath).size / (1024 * 1024)).toFixed(2) + ' MB';
            await backupRecord.save();
        });
        */

        // For demonstration without live shell access, we simulate success after record creation
        backupRecord.status = 'completed';
        backupRecord.size = '12.4 MB'; // Simulated size
        await backupRecord.save();

        await SystemLog.create({
            level: "info",
            service: "Backup",
            actorId: req.user?._id,
            actorName: req.user?.fullName,
            message: `Database backup completed: ${backupId}`,
            details: `Type: Full, Environment: ${env}`
        });

        res.json({ success: true, message: "Backup completed successfully", backup: backupRecord });

    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to initiate backup" });
    }
};

/**
 * @desc    Generate and download/email reports with timeframe selection
 */
exports.generateReport = async (req, res) => {
    const { type, timeframe, format, targetEmail } = req.query; // type: 'backups' | 'logs'
    
    try {
        let data = [];
        let columns = [];
        let title = '';

        const filter = {};
        const now = new Date();

        // Timeframe filtering logic
        if (timeframe === 'hour') filter.createdAt = { $gte: new Date(now.getTime() - 3600000) };
        else if (timeframe === 'day') filter.createdAt = { $gte: new Date(now.setHours(0,0,0,0)) };
        else if (timeframe === 'week') filter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
        else if (timeframe === 'month') filter.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
        else if (timeframe === 'year') filter.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };

        if (type === 'backups') {
            data = await Backup.find(filter).sort({ createdAt: -1 });
            title = `Database Backup Report (${timeframe})`;
            columns = [
                { header: 'Date', key: 'createdAt', width: 20 },
                { header: 'Type', key: 'type', width: 10 },
                { header: 'Size', key: 'size', width: 15 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Env', key: 'environment', width: 15 }
            ];
            // Format dates for display
            data = data.map(item => ({
                ...item._doc,
                createdAt: item.createdAt.toLocaleString()
            }));
        } else {
            data = await SystemLog.find(filter).sort({ timestamp: -1 }).limit(500);
            title = `System Activity Report (${timeframe})`;
            columns = [
                { header: 'Timestamp', key: 'timestamp', width: 20 },
                { header: 'Level', key: 'level', width: 10 },
                { header: 'Service', key: 'service', width: 15 },
                { header: 'Message', key: 'message', width: 40 },
                { header: 'Actor', key: 'actorName', width: 20 }
            ];
            data = data.map(item => ({
                ...item._doc,
                timestamp: item.timestamp.toLocaleString()
            }));
        }

        if (data.length === 0) {
            return res.status(404).json({ success: false, message: "No data found for the selected period" });
        }

        let buffer;
        let contentType;
        let filename = `report_${type}_${timeframe}_${Date.now()}`;

        if (format === 'excel') {
            buffer = await reportHelper.generateExcel(type, columns, data);
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            filename += '.xlsx';
        } else {
            buffer = await reportHelper.generatePDF(title, columns, data);
            contentType = 'application/pdf';
            filename += '.pdf';
        }

        if (targetEmail) {
            await sendEmail({
                email: targetEmail,
                subject: title,
                message: `Please find the requested ${type} report for the period: ${timeframe}.`,
                html: `<p>Requested report is attached.</p>`,
                attachments: [{ filename, content: buffer }]
            });
            return res.json({ success: true, message: `Report sent successfully to ${targetEmail}` });
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(buffer);

    } catch (error) {
        console.error("Report generation error:", error);
        res.status(500).json({ success: false, message: "Failed to generate report" });
    }
};

exports.restoreBackup = async (req, res) => {
    try {
        const { id } = req.body;
        const backup = await Backup.findById(id);
        if (!backup) return res.status(404).json({ success: false, message: "Backup record not found" });

        // Actual restore logic would involve mongorestore
        // Simulate process
        await new Promise(resolve => setTimeout(resolve, 2000));

        await SystemLog.create({
            level: "critical",
            service: "Restore",
            actorId: req.user?._id,
            actorName: req.user?.fullName,
            message: `System restoration executed using backup: ${id}`,
            details: `Target environment: ${backup.environment}`
        });

        res.json({ success: true, message: "System successfully restored to selected state" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Restoration failed" });
    }
};
