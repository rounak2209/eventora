const User = require('../models/User');
const Team = require('../models/Team');
const TeamRequest = require('../models/TeamRequest');
const Event = require('../models/Event');

// ============================================================
// HELPER: Safe Unique Team Size Calculator
// ============================================================
const getUniqueTeamSize = (team) => {
    if (!team) return 0;
    const ids = [];
    if (team.leader) ids.push(team.leader);
    if (team.members && Array.isArray(team.members)) {
        ids.push(...team.members);
    }
    const validIds = ids.filter(id => id).map(id => id.toString());
    return new Set(validIds).size;
};

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


const updateProfile = async (req, res) => {
  try {

    let { skills, bio, isLookingForTeam } = req.body;
    

    if (typeof isLookingForTeam === 'string') {
        isLookingForTeam = isLookingForTeam === 'true';
    }

    let updates = { skills, bio, isLookingForTeam };


    if (req.file) {
        updates.profilePic = req.file.secure_url || req.file.path;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      updates, 
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
    const users = await User.find({ 
        _id: { $ne: req.user._id },
        role: 'student' 
    })

    .select('name email skills bio department year gender role isLookingForTeam profilePic') 
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

    if (eventId) {
      const teams = await Team.find({ event: eventId }).select('members leader');
      let bookedUserIds = [];
      teams.forEach(team => {
        bookedUserIds.push(...team.members);
        bookedUserIds.push(team.leader);
      });
      query._id = { $nin: [...bookedUserIds, req.user._id] }; 
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

    const students = await User.find(query)

      .select('name email skills bio year gender department isLookingForTeam role profilePic')
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

    const event = await Event.findById(eventId).lean();
    const maxAllowed = event?.teamSize?.max ? Number(event.teamSize.max) : 4;

    const allTeams = await Team.find({ 
      event: eventId, 
      isOpen: true,
      leader: { $ne: userId },
      members: { $ne: userId }
    })
    .populate('leader', 'name email profilePic') 
    .lean();

    const matchingTeams = allTeams.filter(team => {
      const currentTeamSize = getUniqueTeamSize(team);
      if (currentTeamSize >= maxAllowed) {
        return false; 
      }

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

    const event = await Event.findById(team.event);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (!team.isOpen) {
        return res.status(403).json({ message: "This squad's entry is finalized. Cannot send requests/invites anymore!" });
    }

    const isAlreadyMember = team.leader.toString() === targetUserId.toString() || 
                            team.members.some(mId => mId.toString() === targetUserId.toString());
    
    if (isAlreadyMember) {
        return res.status(400).json({ message: "User is already currently in the team." });
    }

    const currentTeamSize = getUniqueTeamSize(team);
    const maxAllowed = event.teamSize?.max ? Number(event.teamSize.max) : 4;

    if (currentTeamSize >= maxAllowed) {
        return res.status(400).json({ 
          message: `This team is Housefull! Maximum allowed members for ${event.title} is ${maxAllowed}. You currently have ${currentTeamSize} members. 🚫` 
        });
    }

    const existing = await TeamRequest.findOne({ 
        team: teamId, 
        user: targetUserId 
    });
    
    if (existing) {
        if (existing.status === 'PENDING') {
             return res.status(400).json({ message: "A request is already pending for this user." });
        } 
        else if (existing.status === 'ACCEPTED' || existing.status === 'REJECTED') {
             await TeamRequest.findByIdAndDelete(existing._id);
        }
    }

    await TeamRequest.create({
      team: teamId,
      user: targetUserId,
      event: event._id,
      type: requestType, 
      status: 'PENDING',
      sender: req.user._id,
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

    const request = await TeamRequest.findById(requestId).populate('team');

    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.type === 'JOIN_REQUEST') {
        if (request.team.leader.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Only the Team Leader can accept join requests." });
        }
    } else { // INVITE
        if (request.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You can only respond to your own invites." });
        }
    }

    if (action === 'ACCEPT' && !request.team.isOpen) {
        return res.status(403).json({ message: "This team has already finalized their entry. You cannot join now." });
    }

    if (action === 'REJECT') {
      request.status = 'REJECTED';
      await request.save();
      return res.json({ message: "Request Declined." });
    }

    if (action === 'ACCEPT') {
      const team = await Team.findById(request.team._id);
      const event = await Event.findById(team.event);
      
      const currentTeamSize = getUniqueTeamSize(team);
      const maxAllowed = event?.teamSize?.max ? Number(event.teamSize.max) : 4; 

      if (currentTeamSize >= maxAllowed) {
        return res.status(400).json({ message: `Team is Housefull! Maximum limit is ${maxAllowed}. You currently have ${currentTeamSize} members. 🚫` });
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
    
    const myTeams = await Team.find({ leader: userId }).select('_id');
    const myTeamIds = myTeams.map(t => t._id);

    const requests = await TeamRequest.find({
      $or: [
        { user: userId, type: 'INVITE', status: 'PENDING' }, 
        { team: { $in: myTeamIds }, type: 'JOIN_REQUEST', status: 'PENDING' }
      ]
    })
    .populate('sender', 'name email profilePic') // 🔥 Naya
    .populate('user', 'name skills department year profilePic') // 🔥 Naya
    .populate({
        path: 'team',
        select: 'name leader event isOpen', 
        populate: [
            { path: 'leader', select: 'name email profilePic' }, // 🔥 Naya
            { path: 'event', select: 'title' }
        ]
    })
    .sort({ createdAt: -1 });

    const validRequests = requests.filter(r => r.team?.isOpen !== false);

    res.json(validRequests);

  } catch (error) {
    console.error("Error in getMyRequests:", error);
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