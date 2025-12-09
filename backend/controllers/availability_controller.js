// controllers/availabilityController.js
const Event = require('../models/event_model');
const Availability = require('../models/availability_model');

exports.upsertAvailability = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, slots = [], timeZone } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Convert slots to ISO strings if needed
    const isoSlots = slots.map(s => typeof s === 'string' ? s : new Date(s).toISOString());

    const availability = await Availability.findOneAndUpdate(
      { eventId, userId },
      { $set: { slots: isoSlots, timeZone } },
      { upsert: true, new: true, runValidators: true }
    ).populate('userId', 'userName email');

    res.status(200).json({
      success: true,
      availability
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Availability already exists for this user and event' });
    }
    res.status(400).json({ error: err.message });
  }
};

exports.listAvailabilitiesForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const rows = await Availability.find({ eventId })
      .populate('userId', 'userName email')
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      availabilities: rows
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    const row = await Availability.findById(req.params.availabilityId);
    if (!row) return res.status(404).json({ error: 'Availability not found' });
    res.json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteAvailability = async (req, res) => {
  try {
    const row = await Availability.findByIdAndDelete(req.params.availabilityId);
    if (!row) return res.status(404).json({ error: 'Availability not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Optional: remove by event + email
exports.deleteAvailabilityByEmail = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { email } = req.body;
    const result = await Availability.findOneAndDelete({ eventId, email: email.toLowerCase().trim() });
    if (!result) return res.status(404).json({ error: 'Availability not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
