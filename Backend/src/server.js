require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const setupSuperAdmin = require('./utils/setupSuperAdmin');
const fixFinancialData = require('./utils/dataRepair');

// Connect to database
connectDB().then(() => {
  // Setup super admin once DB is connected
  setupSuperAdmin();
  fixFinancialData();
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
