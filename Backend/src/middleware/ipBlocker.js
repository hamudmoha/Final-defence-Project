const BlockedIP = require('../models/BlockedIP');

// Very basic IP blocking middleware
const ipBlocker = async (req, res, next) => {
  try {
    const ip = req.ip || req.connection?.remoteAddress;
    if (!ip) return next();

    // In a real app, cache this in Redis to avoid DB hits on every request
    const blocked = await BlockedIP.findOne({ ip });
    if (blocked) {
      return res.status(403).json({ success: false, message: 'Your IP address has been blocked from accessing this service.' });
    }
    next();
  } catch (error) {
    next(); // Fail open if DB fails
  }
};

module.exports = ipBlocker;
