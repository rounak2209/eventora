const User = require('../models/User');
const Team = require('../models/Team');
const TeamRequest = require('../models/TeamRequest');
const Event = require('../models/Event');

// 🔥 HELPER: Skill Match Logic
const checkSkillMatch = (userSkills, teamSkills, mode) => {
  if (!userSkills) userSkills = [];
  if (!teamSkills) teamSkills = [];
  
  const uSkills = userSkills.map(s => s.toLowerCase().trim());
  const tSkills = teamSkills.map(s => s.toLowerCase().trim());

  if (!tSkills || tSkills.length === 0) return true; 

  if (mode === 'STRICT') {
    return tSkills.every(skill => uSkills.includes(skill));
  } else {
    return tSkills.some(skill => uSkills.includes(skill));
  }
};

// 1. UPDATE USER PROFILE
const updateProfile = async (req, res) => {
  try {
    const { skills, bio, isLookingForTeam } = req.body;
    
    const user = await User.findByIdAndUpdate(req.user._id, {
      skills, bio, isLookingForTeam
    }, { new: true }).select('-password');

    res.json({ message: "Profile Updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. GET AVAILABLE USERS (Fix: Staff Hide & Self Hide)
const getAvailableUsers = async (req, res) => {
  try {
    // 1. Khud ko hatao ($ne: req.user._id)
    // 2. Sirf 'student' role walon ko dikhao
    const users = await User.find({ 
        _id: { $ne: req.user._id },
        role: 'student'  // 👈 Ye line STAFF ko filter karegi
    })
      .select('name email skills bio department year role') 
      .limit(50); 

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. GET STUDENTS (Legacy / Event-Based Filter)
const getStudents = async (req, res) => {
  try {
    const { eventId, skills, search } = req.query; 

    let query = { 
        isLookingForTeam: true,
        role: 'student' // 👈 Staff Hide
    }; 

    if (eventId) {
      const teams = await Team.find({ event: eventId }).select('members leader');
      let bookedUserIds = [];
      teams.forEach(team => {
        bookedUserIds.push(...team.members);
        bookedUserIds.push(team.leader);
      });
      query._id = { $nin: bookedUserIds }; 
    }

    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim());
      query.skills = { $in: skillArray.map(s => new RegExp(s, 'i')) };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    if (req.user) {
        if (query._id) {
            query._id.$nin.push(req.user._id);
        } else {
            query._id = { $ne: req.user._id };
        }
    }

    const students = await User.find(query)
      .select('name email skills bio year department isLookingForTeam role')
      .lean();

    res.json(students);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. FIND MATCHING TEAMS
const findMatchingTeams = async (req, res) => {
  try {
    const { eventId } = req.query;
    const userId = req.user._id;

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const allTeams = await Team.find({ 
      event: eventId, 
      isOpen: true,
      leader: { $ne: userId },
      members: { $ne: userId }
    })
    .populate('leader', 'name email')
    .lean();

    const matchingTeams = allTeams.filter(team => {
      if (team.requiredYear?.length > 0 && !team.requiredYear.includes(user.year)) {
        return false; 
      }
      return checkSkillMatch(user.skills, team.requiredSkills, team.skillMatchMode);
    });

    res.json(matchingTeams);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. SEND REQUEST (Fix: Handle Duplicate Key Error)
const sendRequest = async (req, res) => {
  try {
    const { teamId, recipientId, type, message } = req.body;
    
    const targetUserId = recipientId || req.user._id;
    const requestType = type || (recipientId ? 'INVITE' : 'JOIN_REQUEST');

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    const eventId = team.event; 

    // 🔥 FIX: Check existing request logic
    const existing = await TeamRequest.findOne({ 
        team: teamId, 
        user: targetUserId,
        event: eventId
    });
    
    if (existing) {
        if (existing.status === 'PENDING') {
             return res.status(400).json({ message: "Request already pending." });
        } 
        else if (existing.status === 'ACCEPTED') {
             return res.status(400).json({ message: "User is already in the team." });
        }
        else if (existing.status === 'REJECTED') {
             // 💡 Agar purani request REJECT hui thi, to use delete karo taaki nayi bana sakein.
             // Ye E11000 duplicate error ko rokega.
             await TeamRequest.findByIdAndDelete(existing._id);
        }
    }

    // Create New Request
    await TeamRequest.create({
      team: teamId,
      user: targetUserId,
      event: eventId,
      type: requestType, 
      status: 'PENDING',
      message: message || "Let's connect!"
    });

    res.status(201).json({ message: "Request Sent! 📩" });

  } catch (error) {
    console.error("Send Request Error:", error);
    // Agar abhi bhi duplicate key error aaye to handle karo
    if (error.code === 11000) {
        return res.status(400).json({ message: "Request already exists." });
    }
    res.status(500).json({ message: error.message });
  }
};

// 6. HANDLE REQUEST (Accept/Reject)
const handleRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body; 
    const userId = req.user._id;

    const request = await TeamRequest.findById(requestId)
      .populate('team')
      .populate('event');

    if (!request) return res.status(404).json({ message: "Request not found" });

    // --- SECURITY CHECK ---
    if (request.type === 'JOIN_REQUEST') {
        if (request.team.leader.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Only Team Leader can manage join requests" });
        }
    }
    if (request.type === 'INVITE') {
        if (request.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "This invite is not for you" });
        }
    }

    // --- REJECT ---
    if (action === 'REJECT') {
      request.status = 'REJECTED';
      await request.save();
      return res.json({ message: "Request Rejected" });
    }

    // --- ACCEPT ---
    if (action === 'ACCEPT') {
      const team = await Team.findById(request.team._id);
      const maxMembers = 4; 

      if ((team.members.length + 1) >= maxMembers) {
        return res.status(400).json({ message: "Team is full now." });
      }

      if (!team.members.includes(request.user)) {
         team.members.push(request.user);
         await team.save();
      }

      request.status = 'ACCEPTED';
      await request.save();
      
      return res.json({ message: "Request Accepted! 🎉" });
    }

  } catch (error) {
    console.error("Handle Request Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 7. GET MY REQUESTS (Inbox Fix)
const getMyRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 1. My Teams (Where I am Leader) -> To see Join Requests
    const myTeams = await Team.find({ leader: userId }).select('_id');
    const myTeamIds = myTeams.map(t => t._id);

    // 2. Fetch Relevant Requests
    const requests = await TeamRequest.find({
      $or: [
        // Case A: I received an INVITE (I am the user)
        { user: userId, type: 'INVITE', status: 'PENDING' },
        
        // Case B: Someone wants to JOIN my team (My team ID is in 'team')
        { team: { $in: myTeamIds }, type: 'JOIN_REQUEST', status: 'PENDING' }
      ]
    })
    .populate('user', 'name skills department')
    .populate('team', 'name leader')
    .sort({ createdAt: -1 });

    res.json(requests);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
    updateProfile, 
    getAvailableUsers, 
    getStudents, 
    findMatchingTeams, 
    sendRequest, 
    handleRequest, 
    getMyRequests 
};