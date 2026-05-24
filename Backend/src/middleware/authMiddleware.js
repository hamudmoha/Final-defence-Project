const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      if (req.user.status === 'soft_deleted' && !req.originalUrl.includes('/restore-manager')) {
        return res.status(401).json({ 
          success: false, 
          message: 'Account deactivated',
          status: 'soft_deleted'
        });
      }
      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && ['admin', 'system_admin', 'super_admin'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
  }
};

const managerOrAdmin = (req, res, next) => {
  const isManager = req.user && (req.user.role === 'manager' || req.user.role === 'camp_manager');
  const isAdmin = req.user && ['admin', 'system_admin', 'super_admin'].includes(req.user.role);
  
  if (isManager || isAdmin) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Forbidden: Manager or Admin access required' });
  }
};

// Blocks banned/suspended users from all mutating operations
// Allow GET requests and the appeal endpoint through
const blockBanned = (req, res, next) => {
  if (!req.user) return next();
  const restricted = ['banned', 'suspended', 'restricted'].includes(req.user.status);
  const isAppeal = req.path.includes('/appeal');
  const isReadOnly = req.method === 'GET';

  if (restricted && !isReadOnly && !isAppeal) {
    return res.status(403).json({
      success: false,
      message: `Your account is ${req.user.status}. You cannot perform this action.`,
      status: req.user.status,
    });
  }
  next();
};

module.exports = { protect, admin, managerOrAdmin, blockBanned };
