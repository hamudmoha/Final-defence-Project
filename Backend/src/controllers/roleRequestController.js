const ApplicationQueue = require('../models/ApplicationQueue');
const User = require('../models/User');
const Camp = require('../models/Camp');

// @desc    Save application draft
// @route   POST /api/role-requests/draft
// @access  Private (Camper only)
exports.saveDraft = async (req, res) => {
  try {
    const { businessName, location, description, phone } = req.body;
    
    // Check if user already has an application
    let application = await ApplicationQueue.findOne({ userId: req.user._id });
    
    if (application && application.rejectionCount >= 3) {
      return res.status(403).json({ success: false, message: 'Maximum application attempts reached.' });
    }

    if (!application) {
      application = new ApplicationQueue({ userId: req.user._id });
    }

    // Update text fields
    if (businessName) application.businessName = businessName;
    if (location) application.location = location;
    if (description) application.description = description;
    if (phone) application.phone = phone;

    // Handle file uploads if they exist (via multer)
    if (req.files) {
      if (req.files.govId) {
        application.govId = req.files.govId[0].path;
      }
      if (req.files.license) {
        application.license = req.files.license[0].path;
      }
      if (req.files.profilePicture) {
        application.profilePicture = req.files.profilePicture[0].path;
      }
      if (req.files.coverPhotos) {
        // Append new cover photos or replace? Replacing is usually safer for drafts, or append.
        // Let's replace for simplicity in draft if they upload new ones, or just push.
        const newPhotos = req.files.coverPhotos.map(file => file.path);
        // If we want to replace:
        application.coverPhotos = newPhotos;
      }
    }

    // If it was rejected previously and they are saving draft, change status back to draft
    if (application.status === 'rejected' && application.rejectionCount < 3) {
      application.status = 'draft';
      application.rejectionReason = undefined;
    }

    await application.save();

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Submit application
// @route   POST /api/role-requests/submit
// @access  Private (Camper only)
exports.submitApplication = async (req, res) => {
  try {
    const application = await ApplicationQueue.findOne({ userId: req.user._id });
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'No draft found.' });
    }

    if (application.rejectionCount >= 3) {
      return res.status(403).json({ success: false, message: 'Maximum application attempts reached.' });
    }

    // Validate required fields
    if (!application.businessName || !application.location || !application.description || !application.govId || !application.license) {
      return res.status(400).json({ success: false, message: 'Please complete all required fields and upload all documents before submitting.' });
    }

    application.status = 'pending';
    await application.save();

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get my application
// @route   GET /api/role-requests/my-request
// @access  Private (Camper only)
exports.getMyApplication = async (req, res) => {
  try {
    const application = await ApplicationQueue.findOne({ userId: req.user._id });
    
    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all pending applications
// @route   GET /api/role-requests
// @access  Private (System Admin only)
exports.getApplications = async (req, res) => {
  try {
    const applications = await ApplicationQueue.find({ status: 'pending' }).populate('userId', 'fullName email profilePicture');
    
    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Review application
// @route   PUT /api/role-requests/:id/review
// @access  Private (System Admin only)
exports.reviewApplication = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const application = await ApplicationQueue.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (status === 'approved') {
      application.status = 'approved';
      
      // Update User Role and Details
      const updates = {
        role: 'manager',
        businessName: application.businessName,
        location: application.location,
        description: application.description,
        license: application.license,
        govId: application.govId
      };
      
      if (application.profilePicture) {
        updates.profilePicture = application.profilePicture;
      }

      await User.findByIdAndUpdate(application.userId, updates);

      // Create new Camp instance
      await Camp.create({
        name: application.businessName,
        location: application.location,
        description: application.description,
        images: application.coverPhotos,
        managerId: application.userId,
        status: 'active'
      });

    } else if (status === 'rejected') {
      application.status = 'rejected';
      application.rejectionReason = rejectionReason;
      application.rejectionCount += 1;
    }

    await application.save();

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
