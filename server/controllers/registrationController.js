const Registration = require('../models/Registration');
const Team = require('../models/Team');

// POST /api/register/event
const registerForEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventId } = req.body; // Frontend se Event ID aayega

    // 1. Leader ki Team dhoondo
    const team = await Team.findOne({ members: userId }).populate('members');

    if (!team) {
      return res.status(404).json({ message: "Pehle Team banao, phir register karo!" });
    }

    // 2. Check: Kya register karne wala Leader hai?
    if (team.leader.toString() !== userId) {
      return res.status(403).json({ message: "Sirf Team Leader hi register kar sakta hai." });
    }

    // 3. (Optional) Check: Kya Team me enough members hain? (e.g., min 2)
    if (team.members.length < 2) {
      return res.status(400).json({ message: "Kam se kam 2 members hone chahiye register karne ke liye." });
    }

    // 4. Check: Kya ye Team pehle se registered hai?
    const existingReg = await Registration.findOne({ team: team._id, event: eventId });
    if (existingReg) {
      return res.status(400).json({ message: "Ye team pehle se registered hai!" });
    }

    // 5. FINAL REGISTRATION CREATE KARO 🎉
    const newRegistration = await Registration.create({
      event: eventId,
      team: team._id,
      registeredBy: userId
    });

    res.status(201).json({
      message: "Registration Successful! 🚀",
      registrationId: newRegistration._id
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerForEvent };