const Camp = require('../models/Camp');

const redactCamp = (camp) => {
  const campObj = camp.toObject ? camp.toObject() : camp;
  if (campObj.location) {
    const parts = campObj.location.split(',');
    campObj.location = parts[0] + ' (Exact location hidden until confirmed)';
  }
  if (campObj.managerId && typeof campObj.managerId === 'object') {
    delete campObj.managerId.email;
    delete campObj.managerId.phone;
  }
  return campObj;
};

// @desc    Get all camps
// @route   GET /api/camps
// @route   GET /api/campHomeRoutes/all
// @access  Public
const getCamps = async (req, res) => {
  try {
    const { search, minPrice, maxPrice, minRating } = req.query;
    const filter = { businessStatus: 'approved', isActive: true, status: 'active' };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
    }

    if (minRating) {
      filter.averageRating = { $gte: Number(minRating) };
    }

    const camps = await Camp.find(filter).populate('managerId', 'fullName');
    const redactedCamps = camps.map(redactCamp);
    res.json({ success: true, data: redactedCamps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single camp
// @route   GET /api/camps/:id
// @route   GET /api/campHomeRoutes/:id
// @access  Public
const getCampById = async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id).populate('managerId', 'fullName');
    if (!camp) return res.status(404).json({ success: false, message: 'Camp not found' });
    res.json({ success: true, data: redactCamp(camp) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Search camps
// @route   GET /api/campHomeRoutes/search
// @access  Public
const searchCamps = async (req, res) => {
  try {
    const { query, location } = req.query;
    const filter = { businessStatus: 'approved', isActive: true, status: 'active' };
    
    if (query) {
      filter.name = { $regex: query, $options: 'i' };
    }
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    const camps = await Camp.find(filter).populate('managerId', 'fullName');
    const redactedCamps = camps.map(redactCamp);
    res.json({ success: true, data: redactedCamps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get logged in manager's camps
// @route   GET /api/camps/my/camps
// @access  Private (Manager/Admin)
const getMyCamps = async (req, res) => {
  try {
    const camps = await Camp.find({ managerId: req.user._id });
    res.json({ success: true, data: camps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create new camp
// @route   POST /api/camps
// @access  Private (Manager)
const createCamp = async (req, res) => {
  try {
    const { name, description, location, amenities } = req.body;
    
    // Convert amenities to array if it's a string, or parse if JSON
    let parsedAmenities = [];
    if (amenities) {
      if (typeof amenities === 'string') {
        try {
          parsedAmenities = JSON.parse(amenities);
        } catch(e) {
          parsedAmenities = amenities.split(',').map(a => a.trim());
        }
      } else if (Array.isArray(amenities)) {
        parsedAmenities = amenities;
      }
    }

    const camp = await Camp.create({
      name,
      description,
      location,
      amenities: parsedAmenities,
      managerId: req.user._id,
      status: 'active',
      businessStatus: 'pending',
      isActive: true
    });

    res.status(201).json({ success: true, data: camp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update camp
// @route   PUT /api/camps/:id
// @access  Private (Manager/Admin)
const updateCamp = async (req, res) => {
  try {
    let camp = await Camp.findById(req.params.id);
    if (!camp) return res.status(404).json({ success: false, message: 'Camp not found' });

    // Ensure user is the manager of this camp or an admin
    if (camp.managerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this camp' });
    }

    if (req.file) {
      if (!req.body.images) req.body.images = camp.images || [];
      // Replace the first image or add if empty
      if (req.body.images.length > 0) {
        req.body.images[0] = req.file.path;
      } else {
        req.body.images.push(req.file.path);
      }
    }

    camp = await Camp.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: camp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete camp
// @route   DELETE /api/camps/:id
// @access  Private (Manager/Admin)
const deleteCamp = async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id);
    if (!camp) return res.status(404).json({ success: false, message: 'Camp not found' });

    // Ensure user is the manager of this camp or an admin
    if (camp.managerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this camp' });
    }

    await camp.deleteOne();
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCamps, getCampById, searchCamps, getMyCamps, createCamp, updateCamp, deleteCamp };
