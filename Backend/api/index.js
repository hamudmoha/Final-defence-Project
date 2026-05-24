const app = require('../src/app');
const connectDB = require('../src/config/db');

// Connect to MongoDB on function cold start
// Mongoose buffers requests until the connection is established.
connectDB();

module.exports = app;
