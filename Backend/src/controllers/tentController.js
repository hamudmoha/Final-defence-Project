const Tent = require('../models/Tent');
const Camp = require('../models/Camp');

// @desc    Get all tents
// @route   GET /api/tents
// @access  Public
const getTents = async (req, res) => {
  try {
    const tents = await Tent.find();
    res.json({ success: true, data: tents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get tents by camp ID
// @route   GET /api/tents/camp/:campId
// @access  Public
const getTentsByCamp = async (req, res) => {
  try {
    const tents = await Tent.find({ campId: req.params.campId });
    res.json({ success: true, data: tents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Add tent to camp
// @route   POST /api/tents/camp/:campId
// @access  Private (Manager/Admin)
const addTent = async (req, res) => {
  try {
    const { name, description, capacity, pricePerNight, amenities, status } = req.body;
    
    // Process uploaded files if using local disk storage
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => file.path || file.url || `/uploads/${file.filename}`);
    }

    const camp = await Camp.findById(req.params.campId);
    if (!camp) return res.status(404).json({ success: false, message: 'Camp not found' });

    // Verify manager owns this camp (skip if admin)
    if (camp.managerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to add tents to this camp' });
    }

    // Safely parse amenities
    let parsedAmenities = [];
    if (amenities) {
      if (Array.isArray(amenities)) {
        parsedAmenities = amenities;
      } else if (typeof amenities === 'string') {
        try {
          parsedAmenities = JSON.parse(amenities);
          if (!Array.isArray(parsedAmenities)) {
            parsedAmenities = [parsedAmenities];
          }
        } catch (e) {
          // Fallback if it's a simple comma-separated string
          parsedAmenities = amenities.split(',').map(a => a.trim()).filter(a => a !== "");
        }
      }
    }

    const formattedStatus = status 
      ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() 
      : 'Available';

    const tent = await Tent.create({
      name,
      description: description || '',
      capacity: parseInt(capacity) || 1,
      pricePerNight: parseFloat(pricePerNight) || 0,
      amenities: parsedAmenities,
      images,
      campId: req.params.campId,
      size: req.body.size || '',
      status: formattedStatus
    });

    res.status(201).json({ success: true, data: tent });
  } catch (err) {
    console.error('Add Tent Error Details:', {
      message: err.message,
      stack: err.stack,
      body: req.body,
      params: req.params,
      user: req.user?._id
    });
    res.status(500).json({ success: false, message: `Tent creation failed: ${err.message}` });
  }
};

// @desc    Update a tent
// @route   PUT /api/tents/:id
// @access  Private (Manager/Admin)
const updateTent = async (req, res) => {
  try {
    let tent = await Tent.findById(req.params.id).populate('campId');
    if (!tent) return res.status(404).json({ success: false, message: 'Tent not found' });

    // Verify ownership
    const camp = tent.campId;
    if (camp.managerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this tent' });
    }

    const { name, description, capacity, pricePerNight, amenities, status } = req.body;
    
    // Handle images: if existingImages is provided, use it (allows removal)
    let images = tent.images;
    if (req.body.existingImages) {
      try {
        images = JSON.parse(req.body.existingImages);
      } catch (e) {
        images = req.body.existingImages;
      }
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path || file.url || `/uploads/${file.filename}`);
      images = [...(Array.isArray(images) ? images : []), ...newImages];
    }

    // Handle amenities
    let updatedAmenities = amenities;
    if (typeof amenities === 'string') {
      try {
        updatedAmenities = JSON.parse(amenities);
      } catch (e) {
        updatedAmenities = amenities.split(',').map(a => a.trim()).filter(Boolean);
      }
    }

    let formattedStatus = tent.status;
    if (status) {
      formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }

    const updatedData = {
      name: name !== undefined ? name : tent.name,
      description: description !== undefined ? description : tent.description,
      capacity: capacity !== undefined ? parseInt(capacity) : tent.capacity,
      pricePerNight: pricePerNight !== undefined ? parseFloat(pricePerNight) : tent.pricePerNight,
      amenities: updatedAmenities !== undefined ? updatedAmenities : tent.amenities,
      size: req.body.size !== undefined ? req.body.size : tent.size,
      status: formattedStatus,
      images
    };

    tent = await Tent.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    
    res.json({ success: true, data: tent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Check tent availability for dates
// @route   GET /api/tents/availability/:campId
// @access  Public
const checkTentAvailability = async (req, res) => {
  try {
    const { campId } = req.params;
    const { checkIn, checkOut } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({ success: false, message: 'Please provide checkIn and checkOut dates' });
    }

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const Booking = require('../models/Booking');

    // Find all overlapping bookings
    const overlappingBookings = await Booking.find({
      campId,
      $and: [
        {
          $or: [
            { status: { $in: ['CONFIRMED', 'PARTIALLY_PAID', 'FULLY_PAID', 'COMPLETED'] } },
            { status: 'PENDING', createdAt: { $gte: fifteenMinutesAgo } }
          ]
        },
        {
          $or: [
            { checkIn: { $lt: new Date(checkOut), $gte: new Date(checkIn) } },
            { checkOut: { $gt: new Date(checkIn), $lte: new Date(checkOut) } },
            { checkIn: { $lte: new Date(checkIn) }, checkOut: { $gte: new Date(checkOut) } }
          ]
        }
      ]
    });

    const bookedTentIds = overlappingBookings.map(b => b.tentId?.toString()).filter(id => id);

    const tents = await Tent.find({ campId });
    
    const tentsWithAvailability = tents.map(tent => {
      const isBooked = bookedTentIds.includes(tent._id.toString());
      const isPhysicallyAvailable = tent.status === 'Available';
      return {
        ...tent.toObject(),
        isAvailable: !isBooked && isPhysicallyAvailable
      };
    });

    res.json({ success: true, data: tentsWithAvailability });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTents, getTentsByCamp, addTent, updateTent, checkTentAvailability };
