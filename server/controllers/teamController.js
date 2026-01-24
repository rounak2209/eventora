const Team = require('../models/Team');
const Event = require('../models/Event');

// 1. CREATE TEAM
// Route: POST /api/teams/create
const createTeam = async (req, res) => {
  try {
    const { name, eventId } = req.body;
    const userId = req.user._id;

    // A. Check: Kya Event exist karta hai?
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // B. Check: Banda pehle se kisi team mein toh nahi?
    const existingTeam = await Team.findOne({ 
      event: eventId, 
      members: userId 
    });
    
    if (existingTeam) {
      return res.status(400).json({ message: "You are already in a team for this event!" });
    }

    // C. Unique Code Banao
    const code = "TEAM-" + Math.floor(1000 + Math.random() * 9000);

    // D. Team Save karo
    // (Dhyan dena: Yahan hum 'team' bana rahe hain)
    const team = await Team.create({
      name,
      code, // Model update karne ke baad ye zaroori hai
      event: eventId,
      leader: userId,
      members: [userId]
    });

    res.status(201).json({ 
      message: "Team Created Successfully! Share the code.", 
      teamCode: code, 
      team 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. JOIN TEAM
// Route: POST /api/teams/join
const joinTeam = async (req, res) => {
  try {
    const { teamCode, eventId } = req.body;
    const userId = req.user._id;

    // A. Team dhundo Code se
    const team = await Team.findOne({ code: teamCode, event: eventId });
    if (!team) {
      return res.status(404).json({ message: "Invalid Team Code or Wrong Event" });
    }

    // B. Check Limit (Yaha console.log laga sakte ho agar check karna hai)
    const event = await Event.findById(eventId);
    
    if (team.members.length >= event.teamSize.max) {
      return res.status(400).json({ message: "Team is already FULL! ⛔" });
    }

    // C. Check Existing Member
    if (team.members.includes(userId)) {
      return res.status(400).json({ message: "You are already in this team!" });
    }

    // D. Add Member
    team.members.push(userId);
    await team.save();

    res.json({ 
      message: "Joined Team Successfully! 🚀", 
      team 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET TEAM DETAILS
// Route: GET /api/teams/my-team
const getMyTeam = async (req, res) => {
  try {
    // 1. Check karo user kis team ka hissa hai
    // Hum dhoond rahe hain wo team jiske 'members' array mein ye user ho
    const team = await Team.findOne({ members: req.user.id })
      .populate('members', 'name email department') // ✨ MAGIC: ID hata ke User ka data layega
      .populate('event', 'name date'); // Event ki details bhi le aayega

    if (!team) {
      return res.status(404).json({ message: "You are not part of any team" });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




module.exports = { createTeam, joinTeam, getMyTeam };