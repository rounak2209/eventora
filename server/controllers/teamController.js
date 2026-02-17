const Team = require('../models/Team');
const Event = require('../models/Event');

// ============================================================
// 1. CREATE TEAM
// ============================================================
const createTeam = async (req, res) => {
  try {
    const { name, eventId, description, requiredSkills, requiredYear, skillMatchMode } = req.body;
    const userId = req.user._id;

    // A. Check: Event exist karta hai?
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 🔥 Check: Agar Solo Event hai, to Team banane mat do
    if (event.isTeamEvent === false) {
      return res.status(400).json({ message: "This is a Solo Event. Teams are not allowed." });
    }

    // B. Check: Kya banda pehle se is event ki kisi team mein hai?
    const existingTeam = await Team.findOne({ 
      event: eventId, 
      members: userId 
    });
    
    if (existingTeam) {
      return res.status(400).json({ message: "You are already in a team for this event!" });
    }

    // C. Unique Code Generation
    const code = "TEAM-" + Math.floor(1000 + Math.random() * 9000);

    // D. Team Save karo
    const team = await Team.create({
      name,
      code, 
      event: eventId,
      leader: userId,
      members: [userId],
      description: description || "Ready to innovate!",
      requiredSkills: requiredSkills || [],
      requiredYear: requiredYear || [],
      skillMatchMode: skillMatchMode || 'FLEXIBLE' 
    });

    res.status(201).json({ 
      message: "Team Created! Share the code with your squad.", 
      teamCode: code, 
      team 
    });

  } catch (error) {
    console.error("Create Team Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 2. JOIN TEAM
// ============================================================
const joinTeam = async (req, res) => {
  try {
    const { teamCode, eventId } = req.body;
    const userId = req.user._id;

    // A. Team dhundo (Case insensitive matching safe side ke liye)
    const team = await Team.findOne({ 
        code: teamCode.toUpperCase(), 
        event: eventId 
    });
    
    if (!team) {
      return res.status(404).json({ message: "Invalid Code or Team doesn't exist for this event." });
    }

    // B. Fetch Event details for team size limit
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const maxMembers = event.teamSize?.max || 4; 
    
    if (team.members.length >= maxMembers) {
      return res.status(400).json({ message: `This squad is already full! (Limit: ${maxMembers})` });
    }

    // C. Check if already a member
    if (team.members.includes(userId)) {
      return res.status(400).json({ message: "You are already a member of this team." });
    }

    // D. Add Member
    team.members.push(userId);
    await team.save();

    res.json({ 
      message: "Welcome to the squad! 🚀", 
      team 
    });

  } catch (error) {
    console.error("Join Team Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 3. GET MY TEAMS
// ============================================================
const getMyTeam = async (req, res) => {
  try {
    // Fetch multiple teams and populate for frontend display
    const teams = await Team.find({ members: req.user._id })
      .populate('members', 'name email department year skills bio') 
      .populate('event', 'title date isTeamEvent venue')
      .sort({ createdAt: -1 });

    res.json(teams); 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 4. LEAVE TEAM
// ============================================================
const leaveTeam = async (req, res) => {
  try {
    const { teamId } = req.body;
    const userId = req.user._id;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Remove User logic
    team.members = team.members.filter(id => id.toString() !== userId.toString());

    // Agar koi bacha hi nahi, delete team
    if (team.members.length === 0) {
      await Team.findByIdAndDelete(teamId);
      return res.json({ message: "You left. Squad disbanded as it was empty." });
    }

    // Agar leader leave kare, to kisi aur ko zimmedari do
    if (team.leader.toString() === userId.toString()) {
      team.leader = team.members[0];
    }

    await team.save();
    res.json({ message: "Successfully left the squad." });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 5. REMOVE MEMBER (Leader Only)
// ============================================================
const removeMember = async (req, res) => {
  try {
    const { teamId, memberId } = req.body;
    const userId = req.user._id; 

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Auth Check
    if (team.leader.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Action denied. Only the leader can remove members." });
    }

    if (userId.toString() === memberId.toString()) {
      return res.status(400).json({ message: "Leader cannot remove themselves. Use Leave instead." });
    }

    team.members = team.members.filter(id => id.toString() !== memberId.toString());
    await team.save();

    res.json({ message: "Member removed from squad." });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 6. DELETE TEAM (Leader Only)
// ============================================================
const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.body;
    const userId = req.user._id;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Auth Check
    if (team.leader.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Action denied. Only the leader can disband the team." });
    }

    await Team.findByIdAndDelete(teamId);
    res.json({ message: "Team has been disbanded successfully." });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  createTeam, 
  joinTeam, 
  getMyTeam, 
  leaveTeam, 
  removeMember, 
  deleteTeam 
};