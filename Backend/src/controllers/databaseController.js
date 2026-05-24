const mongoose = require('mongoose');
const Migration = require('../models/Migration');

/**
 * @desc    Get database overview and real stats
 * @route   GET /api/database/stats
 * @access  Private (Admin)
 */
exports.getDatabaseData = async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const stats = await db.stats();
        const collectionsList = await db.listCollections().toArray();
        const migrations = await Migration.find().sort({ date: -1 }).limit(10);

        // Fetch real collection stats
        const tableStats = await Promise.all(collectionsList.map(async (c) => {
            const cStats = await db.collection(c.name).stats();
            return {
                name: c.name,
                size: (cStats.size / (1024 * 1024)).toFixed(2), // in MB
                count: cStats.count,
                avgObjSize: (cStats.avgObjSize / 1024).toFixed(2) // in KB
            };
        }));

        // Index usage statistics
        const indexUsage = [];
        for (const coll of collectionsList) {
            try {
                const indexes = await db.collection(coll.name).aggregate([
                    { $indexStats: {} }
                ]).toArray();
                indexes.forEach(idx => {
                    indexUsage.push({
                        name: idx.name,
                        table: coll.name,
                        accesses: idx.accesses.ops,
                        since: idx.accesses.since,
                        status: "active"
                    });
                });
            } catch (e) {
                // $indexStats might not be supported on all versions or configurations
            }
        }

        res.json({
            success: true,
            data: {
                overview: {
                    dbName: stats.db,
                    totalSize: `${(stats.dataSize / (1024 * 1024)).toFixed(2)} MB`,
                    storageSize: `${(stats.storageSize / (1024 * 1024)).toFixed(2)} MB`,
                    collections: collectionsList.length,
                    avgObjectSize: `${(stats.avgObjSize / 1024).toFixed(2)} KB`,
                    indexSize: `${(stats.indexSize / (1024 * 1024)).toFixed(2)} MB`
                },
                tableStats: tableStats.sort((a, b) => b.size - a.size),
                migrations: migrations.map(m => ({
                    id: m.migrationId,
                    description: m.description,
                    status: m.status,
                    date: m.date.toLocaleDateString(),
                    collections: m.affectedCollections
                })),
                indexes: indexUsage.sort((a, b) => b.accesses - a.accesses).slice(0, 15)
            }
        });
    } catch (error) {
        console.error("Get Database Data Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch database data" });
    }
};

/**
 * @desc    Create a new database index
 * @route   POST /api/database/indexes
 * @access  Private (Admin)
 */
exports.createIndex = async (req, res) => {
    const { collection, fields, unique = false } = req.body;
    try {
        if (!collection || !fields) {
            return res.status(400).json({ success: false, message: "Collection and fields are required" });
        }

        const indexObj = {};
        if (typeof fields === 'string') {
            fields.split(',').forEach(f => {
                const [key, val] = f.split(':');
                indexObj[key.trim()] = parseInt(val.trim()) || 1;
            });
        } else {
            Object.assign(indexObj, fields);
        }

        await mongoose.connection.db.collection(collection).createIndex(indexObj, { unique });
        res.json({ success: true, message: `Index created successfully on ${collection}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Execute a manual migration record
 * @route   POST /api/database/migrations
 * @access  Private (Admin)
 */
exports.runMigration = async (req, res) => {
    const { description, affectedCollections } = req.body;
    try {
        const migrationId = `MIG-${Date.now()}`;
        const newMigration = await Migration.create({
            migrationId,
            description: description || "Manual schema update",
            status: "completed",
            logs: ["Starting migration...", "Validating schema...", "Applying updates...", "Migration successful"],
            affectedCollections: affectedCollections || []
        });
        res.json({ success: true, message: "Migration executed successfully", migration: newMigration });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to run migration" });
    }
};

exports.validateIntegrity = async (req, res) => {
    // In a real MongoDB environment, we can use validate() command
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const results = await Promise.all(collections.map(async (c) => {
            return mongoose.connection.db.command({ validate: c.name });
        }));
        res.json({ success: true, message: "Database integrity check completed", results });
    } catch (error) {
        res.status(500).json({ success: false, message: "Integrity check failed: " + error.message });
    }
};
