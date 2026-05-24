const Booking = require('../models/Booking');
const Camp = require('../models/Camp');

// @desc    Get reservation stats for manager
// @route   GET /api/reservations/stats
// @access  Private (Manager)
exports.getReservationStats = async (req, res) => {
  try {
    const managerId = req.user._id;
    const myCamps = await Camp.find({ managerId }).select('_id');
    const myCampIds = myCamps.map(c => c._id);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [totalReservations, activeBookings, pendingApproval, checkinsToday] = await Promise.all([
      Booking.countDocuments({ campId: { $in: myCampIds } }),
      Booking.countDocuments({ campId: { $in: myCampIds }, status: { $in: ['CONFIRMED', 'FULLY_PAID', 'PARTIALLY_PAID', 'COMPLETED'] } }),
      Booking.countDocuments({ campId: { $in: myCampIds }, status: 'PENDING' }),
      Booking.countDocuments({ 
        campId: { $in: myCampIds }, 
        checkIn: { $gte: todayStart, $lt: todayEnd }
      })
    ]);

    // Count cancelled for the UI
    const cancelled = await Booking.countDocuments({ campId: { $in: myCampIds }, status: 'CANCELLED' });

    res.json({
      totalReservations,
      activeBookings,
      pendingApproval,
      checkinsToday,
      cancelled
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get reservation chart data
// @route   GET /api/reservations/charts
// @access  Private (Manager)
exports.getReservationCharts = async (req, res) => {
  try {
    const managerId = req.user._id;
    const myCamps = await Camp.find({ managerId }).select('_id');
    const myCampIds = myCamps.map(c => c._id);

    // Get last 7 days for weekly chart
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekly = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.setHours(0,0,0,0));
      const end = new Date(d.setHours(23,59,59,999));
      
      const [bookings, checkouts] = await Promise.all([
        Booking.countDocuments({ campId: { $in: myCampIds }, createdAt: { $gte: start, $lte: end } }),
        Booking.countDocuments({ campId: { $in: myCampIds }, checkOut: { $gte: start, $lte: end }, status: 'COMPLETED' })
      ]);
      
      weekly.push({
        day: days[d.getDay()],
        bookings,
        checkouts
      });
    }

    // Occupancy data based on tent status
    const Tent = require('../models/Tent');
    const tents = await Tent.find({ campId: { $in: myCampIds } });
    
    const available = tents.filter(t => t.status === 'Available').length;
    const occupied = tents.filter(t => ['Occupied', 'Booked'].includes(t.status)).length;
    const maintenance = tents.filter(t => t.status === 'Maintenance').length;

    const occupancy = [
      { name: 'Available', value: available, color: '#0d9488' },
      { name: 'Occupied/Booked', value: occupied, color: '#f59e0b' },
      { name: 'Maintenance', value: maintenance, color: '#ef4444' },
    ];

    res.json({ weekly, occupancy });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all reservations for manager with filters
// @route   GET /api/reservations
// @access  Private (Manager)
exports.getReservations = async (req, res) => {
  try {
    const managerId = req.user._id;
    const { page = 1, limit = 10, status, search, campId } = req.query;

    const myCamps = await Camp.find({ managerId }).select('_id name');
    const myCampIds = myCamps.map(c => c._id);

    let query = { campId: { $in: myCampIds } };

    if (status) query.status = { $regex: new RegExp(`^${status}$`, 'i') };
    if (campId) query.campId = campId;
    if (search) {
      query.$or = [
        { guestName: { $regex: search, $options: 'i' } },
        { reservationCode: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('campId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const formattedData = bookings.map(b => ({
      ...b.toObject(),
      campName: b.campId?.name || 'Unknown Camp'
    }));

    res.json({
      success: true,
      data: formattedData,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
