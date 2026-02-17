const User = require('../models/User');
const Team = require('../models/Team');
const TeamRequest = require('../models/TeamRequest');
const Event = require('../models/Event');

// ============================================================
// 🔥 HELPER: Skill Match Logic
// ============================================================
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

// ============================================================
// 1. UPDATE USER PROFILE (Skills, Bio, etc.)
// ============================================================
const updateProfile = async (req, res) => {
  try {
    const { skills, bio, isLookingForTeam } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      { skills, bio, isLookingForTeam }, 
      { new: true }
    ).select('-password');

    res.json({ message: "Profile Updated Successfully! ✨", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 2. GET AVAILABLE USERS (Default Finder List)
// ============================================================
const getAvailableUsers = async (req, res) => {
  try {
    // 1. Khud ko chhodkar saare 'student' role wale users lao
    const users = await User.find({ 
        _id: { $ne: req.user._id },
        role: 'student' 
    })
    .select('name email skills bio department year role isLookingForTeam') 
    .limit(50); 

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 3. GET STUDENTS (Advanced Filter for Finder)
// ============================================================
const getStudents = async (req, res) => {
  try {
    const { eventId, skills, search } = req.query; 

    let query = { 
        role: 'student', 
        _id: { $ne: req.user._id } 
    }; 

    // Event-specific Filter: Jo pehle se kisi team mein hain unhe hide karo
    if (eventId) {
      const teams = await Team.find({ event: eventId }).select('members leader');
      let bookedUserIds = [];
      teams.forEach(team => {
        bookedUserIds.push(...team.members);
        bookedUserIds.push(team.leader);
      });
      query._id = { $nin: [...bookedUserIds, req.user._id] }; 
    }

    // Skill Filter
    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim());
      query.skills = { $in: skillArray.map(s => new RegExp(s, 'i')) };
    }

    // Text Search (Name or Department)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(query)
      .select('name email skills bio year department isLookingForTeam role')
      .lean();

    res.json(students);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 4. FIND MATCHING TEAMS (Suggestions)
// ============================================================
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
      // Year Check
      if (team.requiredYear?.length > 0 && !team.requiredYear.includes(user.year)) {
        return false; 
      }
      // Skill Logic
      return checkSkillMatch(user.skills, team.requiredSkills, team.skillMatchMode);
    });

    res.json(matchingTeams);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 5. SEND REQUEST (Invite or Join)
// ============================================================
const sendRequest = async (req, res) => {
  try {
    const { teamId, recipientId, type, message } = req.body;
    
    const targetUserId = recipientId || req.user._id;
    const requestType = type || (recipientId ? 'INVITE' : 'JOIN_REQUEST');

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Existing Request Check
    const existing = await TeamRequest.findOne({ 
        team: teamId, 
        user: targetUserId 
    });
    
    if (existing) {
        if (existing.status === 'PENDING') {
             return res.status(400).json({ message: "A request is already pending." });
        } 
        else if (existing.status === 'ACCEPTED') {
             return res.status(400).json({ message: "User is already in the team." });
        }
        else if (existing.status === 'REJECTED') {
             // 💡 Purani rejected request delete karo taaki naya chance mil sake
             await TeamRequest.findByIdAndDelete(existing._id);
        }
    }

    // Create New Request
    await TeamRequest.create({
      team: teamId,
      user: targetUserId,
      event: team.event,
      type: requestType, 
      status: 'PENDING',
      message: message || "Hey, let's team up!"
    });

    res.status(201).json({ message: "Request Sent! 📩" });

  } catch (error) {
    if (error.code === 11000) {
        return res.status(400).json({ message: "You have already sent a request." });
    }
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 6. HANDLE REQUEST (Accept/Reject)
// ============================================================
const handleRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body; 
    const userId = req.user._id;

    const request = await TeamRequest.findById(requestId)
      .populate('team')
      .populate('event');

    if (!request) return res.status(404).json({ message: "Request not found" });

    // Security Check: Only relevant parties can action
    if (request.type === 'JOIN_REQUEST') {
        if (request.team.leader.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Only the Team Leader can accept join requests." });
        }
    } else { // INVITE
        if (request.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You can only respond to your own invites." });
        }
    }

    if (action === 'REJECT') {
      request.status = 'REJECTED';
      await request.save();
      return res.json({ message: "Request Declined." });
    }

    if (action === 'ACCEPT') {
      const team = await Team.findById(request.team._id);
      
      // Team Size Limit Check (Dynamic from Event)
      const event = await Event.findById(team.event);
      const maxMembers = event?.teamSize?.max || 4; 

      if (team.members.length >= maxMembers) {
        return res.status(400).json({ message: "Team is already full!" });
      }

      if (!team.members.includes(request.user)) {
         team.members.push(request.user);
         await team.save();
      }

      request.status = 'ACCEPTED';
      await request.save();
      
      return res.json({ message: "Team Joined Successfully! 🎉" });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 7. GET MY REQUESTS (Inbox Logic)
// ============================================================
const getMyRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 1. Un teams ko dhundo jiska user leader hai (Join requests dekhne ke liye)
    const myTeams = await Team.find({ leader: userId }).select('_id');
    const myTeamIds = myTeams.map(t => t._id);

    // 2. Fetch Pending Requests (Invites for me + Join requests for my team)
    const requests = await TeamRequest.find({
      $or: [
        { user: userId, type: 'INVITE', status: 'PENDING' },
        { team: { $in: myTeamIds }, type: 'JOIN_REQUEST', status: 'PENDING' }
      ]
    })
    .populate('user', 'name skills department year')
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