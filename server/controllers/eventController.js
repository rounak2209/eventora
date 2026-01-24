const Event = require('../models/Event');

// 1. CREATE EVENT (Updated for New Model)
// Route: POST /api/events
const createEvent = async (req, res) => {
  try {
    // Frontend se saara data nikaalo (Naye fields ke saath)
    const { 
      title, 
      description, 
      date, 
      venue, 
      registrationDeadline, 
      category, 
      price, 
      maxSeats, 
      isTeamEvent, 
      teamSize, 
      isLive 
    } = req.body;

    // Validation: Check karo zaruri fields bhare hain ya nahi
    if (!title || !description || !date || !venue || !registrationDeadline || !category || !maxSeats) {
      return res.status(400).json({ message: 'Please fill all required fields (Title, Date, Venue, Deadline, Category, Seats)' });
    }

    // Database me naya event banao
    const event = await Event.create({
      title,
      description,
      date,
      venue,
      registrationDeadline, // New
      category,            // New
      price: price || 0,   // Agar price nahi diya toh 0 (Free)
      maxSeats,            // New
      isTeamEvent: isTeamEvent || false,
      teamSize: teamSize || { min: 1, max: 1 }, // Default team size
      isLive: isLive || false,
      organizer: req.user._id // Middleware se aayi ID
    });

    res.status(201).json({ 
      message: "Event Created Successfully! 🎉", 
      event 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. GET ALL EVENTS
// Route: GET /api/events
const getEvents = async (req, res) => {
  try {
    // Events laao aur Organizer ka naam bhi show karo (.populate)
    const events = await Event.find()
      .populate('organizer', 'name email') // Organizer ki details bhi aa jayengi
      .sort({ date: 1 }); // Jo pehle hone wala hai wo upar
      
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createEvent, getEvents };