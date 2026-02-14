const Event = require('../models/Event');

// 1. CREATE EVENT (Admin/Organizer)
const createEvent = async (req, res) => {
  try {
    const { 
      title, description, date, venue, registrationDeadline, 
      category, price, maxSeats, isTeamEvent, teamSize, isLive 
    } = req.body;

    if (!title || !description || !date || !venue || !registrationDeadline || !category || !maxSeats) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const event = await Event.create({
      title, description, date, venue, registrationDeadline, category,
      price: price || 0,
      maxSeats,
      isTeamEvent: isTeamEvent || false,
      teamSize: teamSize || { min: 1, max: 1 },
      isLive: isLive || false,
      organizer: req.user._id
    });

    res.status(201).json({ message: "Event Created Successfully! 🎉", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. GET ALL EVENTS
const getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'name email')
      .sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. JOIN EVENT (Solo Logic) 🔥 UPDATED WITH ID CHECK
const joinEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.isTeamEvent) {
      return res.status(400).json({ message: "This is a Team Event. Please create or join a team." });
    }

    // 🔥 String conversion added for safe ID matching
    const isAlreadyJoined = event.participants.some(p => p.toString() === userId.toString());

    if (isAlreadyJoined) {
      return res.status(400).json({ message: "You have already joined this event!" });
    }

    event.participants.push(userId);
    await event.save();

    res.json({ message: "Successfully registered! 🚀" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createEvent, getEvents, joinEvent };