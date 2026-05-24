const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Camp = require('../models/Camp');

// @desc    Rate a Camp (by Camper)
// @route   POST /api/reviews/camp
// @access  Private
const rateCamp = async (req, res) => {
  try {
    const { bookingId, campId, rating, comment } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.isRatedByCamper) return res.status(400).json({ success: false, message: 'Already rated' });

    const review = await Review.create({
      bookingId,
      reviewerId: req.user._id,
      targetId: campId,
      targetType: 'Camp',
      rating,
      comment
    });

    // Update Camp Rating
    const camp = await Camp.findById(campId);
    const totalRatings = camp.totalRatings || 0;
    const currentAvg = camp.averageRating || 4; // Use 4 as default if never rated

    const newAvg = ((currentAvg * totalRatings) + rating) / (totalRatings + 1);
    
    camp.averageRating = newAvg;
    camp.totalRatings = totalRatings + 1;
    camp.rating = newAvg; // Sync both for compatibility
    await camp.save();

    booking.isRatedByCamper = true;
    await booking.save();

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Rate a Camper (by Manager)
// @route   POST /api/reviews/camper
// @access  Private
const rateCamper = async (req, res) => {
  try {
    const { bookingId, camperId, rating, comment } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.isRatedByManager) return res.status(400).json({ success: false, message: 'Already rated' });

    const review = await Review.create({
      bookingId,
      reviewerId: req.user._id,
      targetId: camperId,
      targetType: 'User',
      rating,
      comment
    });

    // Update Camper Trust Score (0-100 Scale)
    const camper = await User.findById(camperId);
    if (camper) {
      const currentTrust = camper.trust_score || 100;
      let change = 0;
      
      if (rating === 5) change = 2;       // Great behavior: slight gain
      else if (rating === 4) change = 0;  // Average behavior: no change
      else if (rating === 3) change = -10; // Neutral/Warning: moderate drop
      else if (rating === 2) change = -25; // Bad behavior: significant drop
      else if (rating === 1) change = -40; // Critical behavior: massive drop

      let newTrust = currentTrust + change;
      if (newTrust > 100) newTrust = 100;
      if (newTrust < 0) newTrust = 0;

      camper.trust_score = newTrust;
      camper.totalRatings = (camper.totalRatings || 0) + 1;
      await camper.save();
    }

    booking.isRatedByManager = true;
    await booking.save();

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { rateCamp, rateCamper };
