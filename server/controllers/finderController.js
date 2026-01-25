const User = require('../models/User');
const Team = require('../models/Team');
const TeamRequest = require('../models/TeamRequest');
const Event = require('../models/Event');

// 🔥 HELPER FUNCTION: Check Logic (Strict vs Flexible)
// Ise hum 'findMatchingTeams' aur 'sendRequest' dono me use karenge
const checkSkillMatch = (userSkills, teamSkills, mode) => {
  // Sab lowercase kar lo comparison ke liye
  const uSkills = userSkills.map(s => s.toLowerCase());
  const tSkills = teamSkills.map(s => s.toLowerCase());

  if (!tSkills || tSkills.length === 0) return true; // Agar koi demand hi nahi hai to sab pass

  if (mode === 'STRICT') {
    // STRICT: User ke paas Team ki SAARI skills honi chahiye
    return tSkills.every(skill => uSkills.includes(skill));
  } else {
    // FLEXIBLE: User ke paas Team ki KOI EK skill bhi ho to chalega
    return tSkills.some(skill => uSkills.includes(skill));
  }
};

// 1. UPDATE USER SKILLS (Profile Setup)
const updateProfile = async (req, res) => {
  try {
    const { skills, bio, isLookingForTeam } = req.body;
    
    const user = await User.findByIdAndUpdate(req.user._id, {
      skills,
      bio,
      isLookingForTeam
    }, { new: true });

    res.json({ message: "Profile Updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. FIND SOLO CANDIDATES (Flexible Filter)
const findSoloUsers = async (req, res) => {
  try {
    const { eventId, skills } = req.query; 

    // 1. Booked Users nikalo
    const teams = await Team.find({ event: eventId }).select('members');
    let bookedUserIds = [];
    teams.forEach(team => bookedUserIds.push(...team.members));

    // 2. Basic Query
    let query = {
      _id: { $nin: bookedUserIds },
      isLookingForTeam: true
    };

    // 3. SKILL FILTER LOGIC
    if (skills) {
      const skillArray = skills.split(',');
      query.skills = { 
        $in: skillArray.map(s => new RegExp(s, 'i')) 
      };
    }

    const soloUsers = await User.find(query).select('name email skills bio year department');
    res.json(soloUsers);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. FIND MATCHING TEAMS (Strict/Flexible Based)
const findMatchingTeams = async (req, res) => {
  try {
    const { eventId } = req.query;
    const userId = req.user._id;

    // 1. User ka Data nikalo
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Event ki wo saari teams lao jo "OPEN" hain
    const allTeams = await Team.find({ event: eventId, isOpen: true })
      .populate('leader', 'name email')
      .select('name description requiredSkills requiredYear members skillMatchMode'); // 👈 skillMatchMode select karna mat bhoolna

    // 3. ✨ DYNAMIC FILTERING LOGIC ✨
    const matchingTeams = allTeams.filter(team => {
      
      // A. Check Year Requirement (Hamesha Strict)
      if (team.requiredYear && team.requiredYear.length > 0) {
        if (!team.requiredYear.includes(user.year)) {
          return false; 
        }
      }

      // B. Check Skills Requirement (Based on Team Mode)
      // 👇 HELPER FUNCTION USE KIYA
      const isQualified = checkSkillMatch(user.skills, team.requiredSkills, team.skillMatchMode);
      
      return isQualified; // Agar true hai to team dikhegi, nahi to nahi
    });

    res.json(matchingTeams);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. SEND REQUEST (With Validation)
const sendRequest = async (req, res) => {
  try {
    const { teamId, userId, eventId, type, message } = req.body;
    
    // Check existing request
    const existing = await TeamRequest.findOne({ team: teamId, user: userId, event: eventId });
    if (existing) return res.status(400).json({ message: "Request already pending." });

    const team = await Team.findById(teamId);
    const user = await User.findById(userId);
    const event = await Event.findById(eventId);

    if (!user) return res.status(404).json({ message: `User not found` });

    // --- 🔒 SECURITY CHECK ---
    if (type === 'JOIN_REQUEST') {
      // 1. Year Check
      if (team.requiredYear.length > 0 && !team.requiredYear.includes(user.year)) {
        return res.status(400).json({ message: `Criteria Mismatch: This team requires ${team.requiredYear.join('/')} year students.` });
      }

      // 2. Skill Check (Dynamic)
      // 👇 HELPER FUNCTION USE KIYA
      const isQualified = checkSkillMatch(user.skills, team.requiredSkills, team.skillMatchMode);
      
      if (!isQualified) {
         // Message bhi dynamic bana diya
         const msg = team.skillMatchMode === 'STRICT' 
           ? "Missing skills! This team requires ALL listed skills."
           : "Missing skills! You need at least ONE matching skill.";
         return res.status(400).json({ message: msg });
      }
    }
    // -----------------------------

    // Check Limit
    if (team.members.length >= event.teamSize.max) {
      return res.status(400).json({ message: "Team is already full!" });
    }

    await TeamRequest.create({
      team: teamId,
      user: userId,
      event: eventId,
      type, 
      status: 'PENDING',
      message
    });

    res.status(201).json({ message: "Request Sent Successfully! 📩" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. MANAGE REQUESTS (Accept/Reject)
const handleRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body; 
    const userId = req.user._id;

    const request = await TeamRequest.findById(requestId)
      .populate('team')
      .populate('event');

    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.type === 'JOIN_REQUEST') {
      if (request.team.leader.toString() !== userId.toString()) {
        return res.status(403).json({ message: "Only Team Leader can accept join requests." });
      }
    } else if (request.type === 'INVITE') {
      if (request.user.toString() !== userId.toString()) {
        return res.status(403).json({ message: "This invite is not for you." });
      }
    }

    if (action === 'REJECT') {
      request.status = 'REJECTED';
      await request.save();
      return res.json({ message: "Request Rejected." });
    }

    if (action === 'ACCEPT') {
      if (request.team.members.length >= request.event.teamSize.max) {
        return res.status(400).json({ message: "Team is now full. Cannot accept." });
      }

      await Team.findByIdAndUpdate(request.team._id, {
        $push: { members: request.user }
      });

      request.status = 'ACCEPTED';
      await request.save();
      
      return res.json({ message: "Welcome to the Team! 🎉" });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. GET MY REQUESTS (Notifications)
const getMyRequests = async (req, res) => {
  try {
    const requests = await TeamRequest.find({
      $or: [
        { user: req.user._id }, 
        { team: { $in: await Team.find({ leader: req.user._id }).distinct('_id') } } 
      ]
    })
    .populate('user', 'name skills')
    .populate('team', 'name')
    .sort({ createdAt: -1 });

    res.json(requests);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { updateProfile, findSoloUsers, findMatchingTeams, sendRequest, handleRequest, getMyRequests };