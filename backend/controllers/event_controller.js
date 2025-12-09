// controllers/eventController.js
const Event = require('../models/event_model');
const Availability = require('../models/availability_model');

exports.createEvent = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      creator, 
      window, 
      participants = [],
      startTime,
      endTime,
      selectedDays,
      month,
      year,
      dateRange
    } = req.body;

    if (!window?.start || !window?.end) {
      return res.status(400).json({ error: 'window.start and window.end are required' });
    }

    const event = await Event.create({
      title,
      description,
      creator,
      window,
      participants,
      startTime,
      endTime,
      selectedDays,
      month,
      year,
      dateRange,
      isPublic: true
    });

    res.status(201).json({
      success: true,
      event,
      shareableLink: `/event/${event._id}`
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.listEvents = async (req, res) => {
  try {
    // Optional filtering by creator ?creator=alice@example.com
    const filter = {};
    if (req.query.creator) filter.creator = req.query.creator;

    const events = await Event.find(filter).sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('creator', 'userName email');
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Public endpoint - no auth required
exports.getPublicEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('creator', 'userName email');
    
    if (!event) {
      return res.status(404).json({ 
        success: false,
        error: 'Event not found' 
      });
    }

    if (!event.isPublic) {
      return res.status(403).json({ 
        success: false,
        error: 'This event is private' 
      });
    }

    res.json({
      success: true,
      event
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const allowed = ['title', 'description', 'window', 'participants', 'determinedTime'];
    const updates = {};
    for (const k of allowed) if (k in req.body) updates[k] = req.body[k];

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // If updating window, ensure logical order
    if (updates.window) {
      const { start, end } = updates.window;
      if (!(start && end && new Date(start) < new Date(end))) {
        return res.status(400).json({ error: 'Invalid event window' });
      }
    }

    Object.assign(event, updates);
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Cascade: delete all availabilities for this event
    await Availability.deleteMany({ eventId: event._id });

    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ADD THIS METHOD
exports.finalizeMeeting = async (req, res) => {
  try {
    const { determinedTime } = req.body;
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Validate determinedTime is within window
    const chosenTime = new Date(determinedTime);
    if (chosenTime < event.window.start || chosenTime > event.window.end) {
      return res.status(400).json({ 
        error: 'Determined time must be within event window' 
      });
    }

    event.determinedTime = determinedTime;
    event.status = 'finalized';
    await event.save();

    res.json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get complete meeting summary
exports.getMeetingSummary = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('creator', 'userName email')
      .populate('participants.user', 'userName email');
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const availabilities = await Availability.find({ eventId: event._id })
      .populate('userId', 'userName email');

    res.json({
      event,
      availabilities,
      totalResponses: availabilities.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
