const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const app = express();

// Middleware
const allowedOrigins = [
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(o => o.trim()) : []),
  'http://localhost:5173',
  'http://localhost:5174'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const ipBlocker = require('./middleware/ipBlocker');
app.use(ipBlocker);

// Request Logger (Captures User ID if present)
app.use((req, res, next) => {
  res.on('finish', async () => {
    if (req.path.startsWith('/api') && res.statusCode < 400) {
      try {
        const SystemLog = require('./models/SystemLog');
        const service = req.path.split('/')[2] || 'api';
        await SystemLog.create({
          level: 'info',
          service,
          message: `${req.method} ${req.path}`,
          ip: req.ip || req.connection?.remoteAddress,
          userId: req.user?._id?.toString() || 'Guest',
          details: `Status: ${res.statusCode}`
        });
      } catch (_) {}
    }
  });
  next();
});

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.get('/', (req, res) => res.send('EthioCamp API is running...'));

app.use('/api/auth',           require('./routes/authRoutes'));
app.use('/api/users',          require('./routes/userRoutes'));
app.use('/api/camps',          require('./routes/campRoutes'));
app.use('/api/campHomeRoutes', require('./routes/campHomeRoutes'));
app.use('/api/tents',          require('./routes/tentRoutes'));
app.use('/api/bookings',       require('./routes/bookingRoutes'));
app.use('/api/payments',       require('./routes/paymentRoutes'));
app.use('/api/reservations',   require('./routes/reservationRoutes'));
app.use('/api/tickets',        require('./routes/ticketRoutes'));
app.use('/api/admin',          require('./routes/adminRoutes'));
app.use('/api/dashboard',      require('./routes/dashboardRoutes'));
app.use('/api/alerts',         require('./routes/alertRoutes'));
app.use('/api/manager',        require('./routes/managerRoutes'));

app.use('/api/notifications',  require('./routes/notificationRoutes'));
app.use('/api/moderation',     require('./routes/moderationRoutes'));
app.use('/api/database',       require('./routes/databaseRoutes'));
app.use('/api/backup',         require('./routes/backupRoutes'));
app.use('/api',                require('./routes/supportRoutes'));
app.use('/api/reviews',        require('./routes/reviewRoutes'));
app.use('/api/role-requests',  require('./routes/roleRequestRoutes'));
app.use('/api/ai',             require('./routes/ai.routes'));


// Global error handler — also logs errors to SystemLog
app.use(async (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error(err.stack);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    const ErrorResponse = require('./utils/errorResponse');
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    const ErrorResponse = require('./utils/errorResponse');
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    const ErrorResponse = require('./utils/errorResponse');
    error = new ErrorResponse(message, 400);
  }

  try {
    const SystemLog = require('./models/SystemLog');
    await SystemLog.create({
      level: 'error',
      service: req.path.split('/')[2] || 'api',
      message: error.message || 'Internal Server Error',
      ip: req.ip,
      details: err.stack?.split('\n')[1]?.trim(),
    });
  } catch (_) {}

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error'
  });
});

// Background Tasks: Cleanup expired pending bookings every minute
const { cleanupExpiredBookings } = require('./controllers/bookingController');
setInterval(cleanupExpiredBookings, 60 * 1000);

module.exports = app;
