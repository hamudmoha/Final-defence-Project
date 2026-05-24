const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    const redactedUri = process.env.MONGO_URI 
      ? process.env.MONGO_URI.replace(/\/\/.*:.*@/, '//****:****@') 
      : 'undefined';
    console.error(`MongoDB Connection Error: ${err.message}`);
    console.error(`Attempted URI: ${redactedUri}`);
    process.exit(1);
  }
};

module.exports = connectDB;
