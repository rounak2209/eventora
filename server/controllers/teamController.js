const Team = require('../models/Team');
const Event = require('../models/Event');

// 1. CREATE TEAM
// Route: POST /api/teams/create
const createTeam = async (req, res) => {
  try {
    const { name, eventId, description, requiredSkills, requiredYear, skillMatchMode } = req.body;
    const userId = req.user._id;

    // A. Check: Kya Event exist karta hai?
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 🔥 Check: Agar Solo Event hai, to Team banane mat do
    if (event.isTeamEvent === false) {
      return res.status(400).json({ message: "This is a Solo Event. You cannot create a team for it." });
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
    const team = await Team.create({
      name,
      code, 
      event: eventId,
      leader: userId,
      members: [userId],
      description: description || "Join us to win!",
      requiredSkills: requiredSkills || [],
      requiredYear: requiredYear || [],
      skillMatchMode: skillMatchMode || 'FLEXIBLE' 
    });

    res.status(201).json({ 
      message: "Team Created Successfully! Share the code.", 
      teamCode: code, 
      team 
    });

  } catch (error) {
    console.error("Create Team Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 2. JOIN TEAM
// Route: POST /api/teams/join
const joinTeam = async (req, res) => {
  try {
    const { teamCode, eventId } = req.body;
    const userId = req.user._id;

    // A. Team dhundo Code aur Event ID se
    const team = await Team.findOne({ code: teamCode, event: eventId });
    
    if (!team) {
      return res.status(404).json({ message: "Invalid Team Code or this team does not belong to the selected event." });
    }

    // B. Check Limit
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const maxMembers = event.teamSize?.max || 4; 
    
    if (team.members.length >= maxMembers) {
      return res.status(400).json({ message: `Team is already FULL! (Max ${maxMembers}) ⛔` });
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
    console.error("Join Team Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 3. GET MY TEAMS (🔥 UPDATED: Returns Array)
// Route: GET /api/teams/my-team
const getMyTeam = async (req, res) => {
  try {
    // .find() use kiya taaki multiple teams aaye
    const teams = await Team.find({ members: req.user._id })
      .populate('members', 'name email department year') 
      .populate('event', 'title date isTeamEvent')
      .sort({ createdAt: -1 });

    res.json(teams); 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. LEAVE TEAM (Member Action)
// Route: POST /api/teams/leave
const leaveTeam = async (req, res) => {
  try {
    const { teamId } = req.body;
    const userId = req.user._id;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Remove User
    team.members = team.members.filter(id => id.toString() !== userId.toString());

    // Agar Team khali ho gayi, to delete
    if (team.members.length === 0) {
      await Team.findByIdAndDelete(teamId);
      return res.json({ message: "You left. Team deleted as it became empty." });
    }

    // Agar Leader leave kar raha hai, to next member ko leader banao
    if (team.leader.toString() === userId.toString()) {
      team.leader = team.members[0];
    }

    await team.save();
    res.json({ message: "You left the team." });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. REMOVE MEMBER (Leader Action)
// Route: POST /api/teams/remove-member
const removeMember = async (req, res) => {
  try {
    const { teamId, memberId } = req.body;
    const userId = req.user._id; // Requester (Leader)

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Check: Only Leader can do this
    if (team.leader.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only Team Leader can remove members." });
    }

    // Leader khud ko remove nahi karega
    if (userId.toString() === memberId.toString()) {
      return res.status(400).json({ message: "Leader cannot remove themselves." });
    }

    // Remove Member
    team.members = team.members.filter(id => id.toString() !== memberId.toString());
    await team.save();

    res.json({ message: "Member removed successfully." });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. DELETE TEAM (Leader Action)
// Route: DELETE /api/teams/delete
const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.body;
    const userId = req.user._id;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Check Leader
    if (team.leader.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only Team Leader can delete the team." });
    }

    await Team.findByIdAndDelete(teamId);
    res.json({ message: "Team deleted successfully." });

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