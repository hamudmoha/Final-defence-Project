const User = require('../models/User');

const setupSuperAdmin = async () => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@ethiocamp.com';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'AdminPassword123!';
    const emailNormalized = String(email).toLowerCase().trim();

    let user = await User.findOne({ role: 'system_admin' });
    if (!user) user = await User.findOne({ email: emailNormalized });

    if (!user) {
      const superAdmin = await User.create({
        fullName: 'Platform System Administrator',
        email: emailNormalized,
        password: password, // Model pre-save will hash
        role: 'system_admin',
        isInternal: true,
        isVerified: true,
        isEmailVerified: true,
        mustResetPassword: true,
      });
      console.log('✅ Super Admin account created automatically:', superAdmin.email);
    } else {
      // Update existing admin if needed (optional, following user's script logic)
      user.role = 'system_admin';
      user.isInternal = true;
      user.isVerified = true;
      user.isEmailVerified = true;

      const isPasswordMatch = await user.matchPassword(password);
      if (!isPasswordMatch) {
        user.password = password;
        console.log('🔄 Super Admin password updated to match environment variables.');
      }

      await user.save();
      console.log('✅ Super Admin account already exists and is synchronized.');
    }
  } catch (error) {
    console.error('❌ Error setting up super admin:', error.message);
  }
};

module.exports = setupSuperAdmin;
