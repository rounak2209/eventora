const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const Team = require('../models/Team'); 

// 1. Get Chat History (Specific User ke sath)
const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isGroup } = req.query;
    const myId = req.user._id;

    let query;

    if (isGroup === 'true') {
        // Group Chat: Messages for the Team ID
        query = { recipient: userId, isGroup: true };
    } else {
        // 1-on-1 Chat
        query = {
            $or: [
                { sender: myId, recipient: userId, isGroup: false },
                { sender: userId, recipient: myId, isGroup: false }
            ]
        };
    }

    const messages = await Message.find(query)
        .populate('sender', 'name email') 
        .sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Mark messages as read
const markAsRead = async (req, res) => {
    try {
        const { senderId } = req.body;
        const myId = req.user._id;

        await Message.updateMany(
            { sender: senderId, recipient: myId, read: false },
            { $set: { read: true } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

//  3. GET INBOX CONVERSATIONS (Filtered: No Teammates)
const getInboxConversations = async (req, res) => {
    try {
        const myId = req.user._id;

        // --- STEP 1: Find all my Teammates ---

        const myTeams = await Team.find({
            $or: [
                { members: myId },
                { leader: myId }
            ]
        });

        let teammateIds = [];
        
        // Saare teammates ki IDs collect karo
        myTeams.forEach(team => {

            if (team.leader && String(team.leader) !== String(myId)) {
                teammateIds.push(String(team.leader));
            }
            // Add Members (mujhe chhod kar)
            team.members.forEach(memberId => {
                if (String(memberId) !== String(myId)) {
                    teammateIds.push(String(memberId));
                }
            });
        });


        const excludeIds = [...new Set(teammateIds)].map(id => new mongoose.Types.ObjectId(id));

        // --- STEP 2: Aggregate Messages with Filter ---
        const conversations = await Message.aggregate([
            {
                // Find messages involving me
                $match: {
                    $or: [{ sender: myId }, { recipient: myId }]
                }
            },
            {
                // Sort by latest
                $sort: { timestamp: -1 }
            },
            {
                // Group by the "Other Person"
                $group: {
                    _id: {
                        $cond: {
                            if: { $eq: ["$sender", myId] },
                            then: "$recipient",
                            else: "$sender"
                        }
                    },
                    lastMessage: { $first: "$content" },
                    timestamp: { $first: "$timestamp" },
                    otherUserId: { 
                        $first: {
                            $cond: {
                                if: { $eq: ["$sender", myId] },
                                then: "$recipient",
                                else: "$sender"
                            }
                        }
                    }
                }
            },
            // FILTER STAGE: Exclude users who are in my Teammate List
            {
                $match: {
                    otherUserId: { $nin: excludeIds } 
                }
            },
            {
                // Join User Details
                $lookup: {
                    from: 'users',
                    localField: 'otherUserId',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            { $unwind: "$userDetails" },
            {
                // Format Output
                $project: {
                    _id: "$userDetails._id",
                    name: "$userDetails.name",
                    email: "$userDetails.email",
                    lastMessage: 1,
                    timestamp: 1
                }
            },
            { $sort: { timestamp: -1 } }
        ]);

        res.json(conversations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching inbox chats" });
    }
};

module.exports = { getChatHistory, markAsRead, getInboxConversations };