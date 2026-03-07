const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Team = require('../models/Team');
const User = require('../models/User');
const QRCode = require('qrcode');
const sendEmail = require('../utils/sendEmail');
const mongoose = require('mongoose');

// ============================================================
// 1. BOOK TICKET (Solo or Team Registration)
// ============================================================
const bookTicket = async (req, res) => {
    console.log("🎫 Booking Process Started...");
    try {
        const { eventId } = req.body;
        const userId = req.user._id;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });


        event.participants = event.participants || [];
        event.joinedTeams = event.joinedTeams || [];

        let finalUsersList = [];
        let team = null;

        if (event.isTeamEvent) {
            team = await Team.findOne({
                event: eventId,
                $or: [{ leader: userId }, { members: userId }]
            });

            if (!team) {
                return res.status(400).json({ message: "You need a team to register for this event." });
            }

            // SMART VALIDATION 1: Team Size Checking (Min & Max)
            //  ek Set use kar rahe hu taaki agar galti se leader members array me bhi ho, toh double count na ho
            const allTeamMembers = [team.leader, ...(team.members || [])];
            const uniqueTeamMembersCount = new Set(allTeamMembers.map(id => id.toString())).size;
            
            const minSize = Number(event.teamSize?.min || 1);
            const maxSize = Number(event.teamSize?.max || 4);

            if (uniqueTeamMembersCount < minSize || uniqueTeamMembersCount > maxSize) {
                return res.status(400).json({ 
                    message: `Invalid team size! This event requires minimum ${minSize} and maximum ${maxSize} members. Your squad currently has ${uniqueTeamMembersCount} member(s).` 
                });
            }

            //  SMART VALIDATION 2: Max Seats (Total Teams Limit) Checking
            const isTeamAlreadyJoined = event.joinedTeams.some(tId => tId.toString() === team._id.toString());
            
            if (!isTeamAlreadyJoined && event.joinedTeams.length >= event.maxSeats) {
                return res.status(400).json({ message: "Max slots reached! No more teams can join this event. 🚫" });
            }

            let uniqueIds = [...new Set(allTeamMembers.map(id => id.toString()))];

            await Registration.deleteMany({
                event: eventId,
                user: { $in: uniqueIds }
            });

            finalUsersList = await User.find({ _id: { $in: uniqueIds } });
        } 
        else {
            //  SMART VALIDATION 3: Solo Event Max Seats Checking
            const isUserAlreadyJoined = event.participants.some(pId => pId.toString() === userId.toString());
            
            if (!isUserAlreadyJoined && event.participants.length >= event.maxSeats) {
                return res.status(400).json({ message: "Max slots reached! Event is Housefull. 🚫" });
            }

            await Registration.deleteOne({ event: eventId, user: userId });
            finalUsersList = [req.user];
        }

        const results = [];

        for (const member of finalUsersList) {
            try {
                const qrPayload = JSON.stringify({
                    userId: member._id.toString(),
                    eventId: eventId.toString(),
                    teamId: team ? team._id.toString() : null,
                    type: "GATE_PASS"
                });

                // Live QR Code URL for Gmail (No Block!)
                const qrLiveUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPayload)}`;

                const qrImage = await QRCode.toDataURL(qrPayload);
                const qrBase64 = qrImage.split("base64,")[1];

                const ticket = await Registration.create({
                    user: member._id,
                    event: eventId,
                    team: team ? team._id : null,
                    qrCodeData: qrPayload,
                    paymentStatus: 'Paid',
                    hasAttended: false
                });

                if (!event.participants.includes(member._id)) {
                    event.participants.push(member._id);
                }


                const emailTemplate = `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 15px; max-width: 500px;">
                        <h2 style="color: #4f46e5;">Registration Confirmed! 🎉</h2>
                        <p>Hi <b>${member.name}</b>, your entry pass for <b>${event.title}</b> is ready.</p>
                        <div style="background: #f8fafc; padding: 15px; border-radius: 10px; margin: 20px 0;">
                            <p style="margin: 0;"><b>Venue:</b> ${event.venue}</p>
                            <p style="margin: 5px 0;"><b>Squad:</b> ${team ? team.name : 'Solo'}</p>
                            <p style="margin: 0;"><b>Ticket ID:</b> ${ticket._id.toString().slice(-8).toUpperCase()}</p>
                        </div>
                        <p style="text-align: center;">
                            <img src="${qrLiveUrl}" width="200" style="border: 4px solid #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-radius: 8px;" alt="Event QR Code" />
                        </p>
                        <p style="font-size: 12px; color: #64748b;">Please show this QR code at the entrance.</p>
                    </div>
                `;

                await sendEmail({
                    email: member.email,
                    subject: `🎟️ Entry Pass: ${event.title}`,
                    message: emailTemplate,
                    attachments: [{ filename: 'ticket-qr.png', content: qrBase64 }] 
                });

                results.push({ email: member.email, status: "Success" });

            } catch (err) {
                console.error(`Error processing ticket for ${member.email}:`, err.message);
                results.push({ email: member.email, status: "Failed", error: err.message });
            }
        }

        if (team) {
            team.isOpen = false;
            await team.save();
            
            // 🔥 UPDATE TEAM IN EVENT ARRAY (Track Total Teams Joined)
            if (!event.joinedTeams.includes(team._id)) {
                event.joinedTeams.push(team._id);
            }
        }

        await event.save();
        res.status(201).json({ message: "Registration successful! Tickets sent to email.", results });

    } catch (error) {
        console.error("Booking Error:", error);
        res.status(500).json({ message: error.message });
    }
};

const verifyTicket = async (req, res) => {
    try {
        const { qrData, eventId } = req.body; 

        if (!qrData || !eventId) {
            return res.status(400).json({ message: "Invalid scan: Missing data." });
        }

        let ticket = null;
        const cleanQR = qrData.trim();

        try {
            const parsed = JSON.parse(cleanQR);
            if (parsed.userId) {
                ticket = await Registration.findOne({ 
                    user: parsed.userId, 
                    event: eventId 
                }).populate('user').populate('event');
            }
        } catch (e) {
        }

        if (!ticket && mongoose.Types.ObjectId.isValid(cleanQR)) {
            ticket = await Registration.findById(cleanQR).populate('user').populate('event');
        }

        if (!ticket) {
            ticket = await Registration.findOne({ qrCodeData: cleanQR }).populate('user').populate('event');
        }

        if (!ticket) {
            return res.status(404).json({ message: "❌ Invalid Ticket! No record found." });
        }

        if (ticket.event._id.toString() !== eventId.toString()) {
            return res.status(403).json({ 
                message: `⛔ Wrong Event! This ticket is for "${ticket.event.title}"` 
            });
        }

        if (ticket.hasAttended) {
            return res.status(400).json({ 
                message: `⚠️ ALREADY SCANNED at ${new Date(ticket.checkInTime).toLocaleTimeString()}` 
            });
        }

        ticket.hasAttended = true;
        ticket.checkInTime = Date.now();
        await ticket.save();

        res.json({
            success: true,
            message: "Entry Granted ✅",
            student: {
                name: ticket.user.name,
                department: ticket.user.department || "N/A",
                year: ticket.user.year || "N/A",
                email: ticket.user.email
            }
        });

    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ message: "Internal server error during verification." });
    }
};

module.exports = { bookTicket, verifyTicket };