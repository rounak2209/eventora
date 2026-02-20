const Event = require('../models/Event');
const Registration = require('../models/Registration'); 
const User = require('../models/User');

// ==========================================
// 1. CREATE EVENT (By Organizer)
// ==========================================
const createEvent = async (req, res) => {
  try {
    const { 
      title, description, date, venue, registrationDeadline, 
      category, price, maxSeats, isTeamEvent, teamSizeMin, teamSizeMax, isLive 
    } = req.body;

    // Basic Validation
    if (!title || !description || !date || !venue || !registrationDeadline || !category || !maxSeats) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    // Safety: Registration deadline event ki date se pehle honi chahiye
    if (new Date(registrationDeadline) > new Date(date)) {
        return res.status(400).json({ message: 'Deadline cannot be after the event date!' });
    }

    // 🔥 Multer ne photo upload karke req.file mein link de diya hai
    const bannerUrl = req.file ? req.file.path : "";

    const event = await Event.create({
      title, 
      description, 
      date, 
      venue, 
      registrationDeadline, 
      category,
      banner: bannerUrl, // 👈 Photo URL Save karo
      price: Number(price) || 0,
      maxSeats: Number(maxSeats),
      isTeamEvent: isTeamEvent === 'true', // FormData se string aati hai
      teamSize: { 
        min: Number(teamSizeMin) || 1, 
        max: Number(teamSizeMax) || 1 
      },
      isLive: isLive === 'true',
      organizer: req.user._id
    });

    res.status(201).json({ message: "Event Created Successfully! 🎉", event });
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 2. GET ALL EVENTS (For Marketplace)
// ==========================================
const getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'name email')
      .sort({ date: 1 })
      .lean(); 
      
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 3. GET GATEKEEPER DUTIES (With Live Stats)
// ==========================================
const getGatekeeperEvents = async (req, res) => {
  try {
    const gatekeeper = await User.findById(req.user._id);

    if (!gatekeeper) {
        return res.status(404).json({ message: "Gatekeeper profile not found" });
    }

    const events = await Event.find({
        _id: { $in: gatekeeper.assignedEvents } 
    }).sort({ date: 1 }).lean();

    const eventsWithStats = await Promise.all(events.map(async (event) => {
        const totalRegistrations = await Registration.countDocuments({ event: event._id });
        const scannedCount = await Registration.countDocuments({ event: event._id, hasAttended: true });

        return {
            ...event,
            stats: {
                total: totalRegistrations,
                present: scannedCount,
                pending: Math.max(0, totalRegistrations - scannedCount)
            }
        };
    }));

    res.json(eventsWithStats);

  } catch (error) {
    res.status(500).json({ message: "Error fetching duties: " + error.message });
  }
};

// ==========================================
// 4. JOIN EVENT (Solo Registration Logic)
// ==========================================
const joinEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Team Event check
    if (event.isTeamEvent) {
      return res.status(400).json({ message: "This is a Team Event. Please create/join a team to register." });
    }

    // Housefull check
    if (event.participants.length >= event.maxSeats) {
        return res.status(400).json({ message: "Event is Housefull! 🚫" });
    }

    // Duplicate check
    const isAlreadyJoined = event.participants.some(p => p.toString() === userId.toString());
    if (isAlreadyJoined) {
      return res.status(400).json({ message: "You are already registered for this event!" });
    }

    // Success: Participant add karo
    event.participants.push(userId);
    await event.save();

    res.json({ message: "Registration successful! 🚀 Check your dashboard for the ticket." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createEvent, getEvents, getGatekeeperEvents, joinEvent };