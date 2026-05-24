const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeder');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectDB();

    const adminExists = await User.findOne({ email: 'systemadmin@ethiocamp.et' });

    if (adminExists) {
      console.log('Systemadmin already exists!');
      process.exit();
    }

    const superAdmin = new User({
      fullName: 'System Admin',
      email: 'systemadmin@ethiocamp.et',
      password: 'SuperSecurePassword123!',
      phone: '+251900000000',
      role: 'admin',
      status: 'active',
      isVerified: true
    });

    await superAdmin.save();

    console.log('SystemAdmin Created Successfully!');
    console.log('Email: systemadmin@ethiocamp.et');
    console.log('Password: SuperSecurePassword123!');
    
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

importData();
