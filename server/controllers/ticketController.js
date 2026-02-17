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

        // 1. Check Event Existence
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        let finalUsersList = [];
        let team = null;

        // --- CASE A: TEAM EVENT ---
        if (event.isTeamEvent) {
            // Find Team where user is either Leader or Member
            team = await Team.findOne({
                event: eventId,
                $or: [{ leader: userId }, { members: userId }]
            });

            if (!team) {
                return res.status(400).json({ message: "You need a team to register for this event." });
            }

            // Get all member IDs and remove duplicates
            let allMemberIds = [team.leader, ...team.members];
            let uniqueIds = [...new Set(allMemberIds.map(id => id.toString()))];

            // CRITICAL: Clear any previous partial/bad registrations for this team
            await Registration.deleteMany({
                event: eventId,
                user: { $in: uniqueIds }
            });

            finalUsersList = await User.find({ _id: { $in: uniqueIds } });
        } 
        // --- CASE B: SOLO EVENT ---
        else {
            await Registration.deleteOne({ event: eventId, user: userId });
            finalUsersList = [req.user];
        }

        const results = [];

        // 2. Loop through all members (or solo user) to generate tickets
        for (const member of finalUsersList) {
            try {
                // Generate Standardized JSON QR Payload (Matches Frontend Modal)
                const qrPayload = JSON.stringify({
                    userId: member._id.toString(),
                    eventId: eventId.toString(),
                    teamId: team ? team._id.toString() : null,
                    type: "GATE_PASS"
                });

                const qrImage = await QRCode.toDataURL(qrPayload);

                // Create Database Entry
                const ticket = await Registration.create({
                    user: member._id,
                    event: eventId,
                    team: team ? team._id : null,
                    qrCodeData: qrPayload,
                    paymentStatus: 'Paid',
                    hasAttended: false
                });

                // Update Event Participants list for Stats
                if (!event.participants.includes(member._id)) {
                    event.participants.push(member._id);
                }

                // 3. Send Professional Confirmation Email
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
                            <img src="cid:qr" width="200" style="border: 4px solid #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-radius: 8px;" />
                        </p>
                        <p style="font-size: 12px; color: #64748b;">Please show this QR code at the entrance.</p>
                    </div>
                `;

                await sendEmail({
                    email: member.email,
                    subject: `🎟️ Entry Pass: ${event.title}`,
                    message: emailTemplate,
                    attachments: [{
                        filename: 'ticket-qr.png',
                        content: qrImage.split("base64,")[1],
                        encoding: 'base64',
                        cid: 'qr'
                    }]
                });

                results.push({ email: member.email, status: "Success" });

            } catch (err) {
                console.error(`Error processing ticket for ${member.email}:`, err.message);
                results.push({ email: member.email, status: "Failed", error: err.message });
            }
        }

        await event.save();
        res.status(201).json({ message: "Registration successful! Tickets sent to email.", results });

    } catch (error) {
        console.error("Booking Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// ============================================================
// 2. VERIFY TICKET (Scanner Logic)
// ============================================================
const verifyTicket = async (req, res) => {
    try {
        const { qrData, eventId } = req.body; // eventId is from Gatekeeper's selected duty

        if (!qrData || !eventId) {
            return res.status(400).json({ message: "Invalid scan: Missing data." });
        }

        let ticket = null;
        const cleanQR = qrData.trim();

        // --- STRATEGY 1: JSON PAYLOAD MATCH (New System) ---
        try {
            const parsed = JSON.parse(cleanQR);
            if (parsed.userId) {
                ticket = await Registration.findOne({ 
                    user: parsed.userId, 
                    event: eventId 
                }).populate('user').populate('event');
            }
        } catch (e) {
            // Not a JSON, fallback to other strategies
        }

        // --- STRATEGY 2: DIRECT ID MATCH (Legacy Support) ---
        if (!ticket && mongoose.Types.ObjectId.isValid(cleanQR)) {
            ticket = await Registration.findById(cleanQR).populate('user').populate('event');
        }

        // --- STRATEGY 3: RAW STRING MATCH ---
        if (!ticket) {
            ticket = await Registration.findOne({ qrCodeData: cleanQR }).populate('user').populate('event');
        }

        // --- VALIDATION CHECKS ---
        if (!ticket) {
            return res.status(404).json({ message: "❌ Invalid Ticket! No record found." });
        }

        // 1. Wrong Event Check
        if (ticket.event._id.toString() !== eventId.toString()) {
            return res.status(403).json({ 
                message: `⛔ Wrong Event! This ticket is for "${ticket.event.title}"` 
            });
        }

        // 2. Double Entry Check
        if (ticket.hasAttended) {
            return res.status(400).json({ 
                message: `⚠️ ALREADY SCANNED at ${new Date(ticket.checkInTime).toLocaleTimeString()}` 
            });
        }

        // --- GRANT ACCESS ---
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