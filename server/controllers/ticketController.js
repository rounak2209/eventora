const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Team = require('../models/Team');
const User = require('../models/User'); 
const QRCode = require('qrcode');
const sendEmail = require('../utils/sendEmail');
const mongoose = require('mongoose');

// ==========================================
// 1. BOOK TICKET (Standardized QR Generation)
// ==========================================
const bookTicket = async (req, res) => {
  console.log("\n🚀 FINAL BOOKING PROCESS STARTED..."); 
  try {
    const { eventId } = req.body;
    const userId = req.user._id;

    console.log(`👉 Event: ${eventId}, User: ${userId}`);

    // 1. Check Event
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    let finalUsersList = []; 
    let team = null;

    if (event.isTeamEvent) {
      console.log("🔍 Team Event. Finding User's Team...");

      // 🔥 Step 1: Find Team (Leader OR Member)
      team = await Team.findOne({ 
        event: eventId, 
        $or: [
            { leader: userId },
            { members: userId }
        ]
      });
      
      if (!team) {
          console.log("❌ No Team Found for this user in this event.");
          return res.status(400).json({ message: "You are not part of any team for this event." });
      }

      console.log(`✅ Team Found: ${team.name} (ID: ${team._id})`);

      // 🔥 Step 2: Get ALL IDs (Leader + Members)
      let allMemberIds = [team.leader, ...team.members];
      let uniqueIds = [...new Set(allMemberIds.map(id => id.toString()))]; // Remove duplicates

      console.log(`👥 Total Members to Register: ${uniqueIds.length}`);

      // 🔥 Step 3: CRITICAL FIX - Delete Old/Bad Registrations
      // Agar pehle "null" team wali entry ban gayi thi, use uda do taaki nayi sahi wali bane.
      await Registration.deleteMany({ 
          event: eventId, 
          user: { $in: uniqueIds } 
      });
      console.log("🧹 Old/Bad registrations cleared for these users.");

      // Step 4: Fetch User Objects
      finalUsersList = await User.find({ _id: { $in: uniqueIds } });
    } 
    // --- CASE B: SOLO EVENT ---
    else {
      console.log("👤 Solo Event.");
      finalUsersList = [req.user];
      
      // Delete old logic for solo too
      await Registration.deleteOne({ event: eventId, user: userId });
    }

    const results = [];

    // --- LOOP START ---
    for (const member of finalUsersList) {
      try {
        console.log(`🎫 Generating Fresh Ticket for: ${member.email}`);

        // 1. Generate QR (With Team ID)
        const qrPayload = JSON.stringify({ 
            userId: member._id.toString(), 
            eventId: eventId.toString(), 
            teamId: team ? team._id.toString() : null, // ✅ Team ID Guaranteed
            type: "GATE_PASS" 
        });
        
        const qrImage = await QRCode.toDataURL(qrPayload);

        // 2. Create Ticket in DB
        const ticket = await Registration.create({
          user: member._id,
          event: eventId,
          team: team ? team._id : null, // ✅ Saved in DB
          qrCodeData: qrPayload, 
          paymentStatus: 'Paid',
          hasAttended: false
        });

        // 3. Update Event Participants
        if (!event.participants.includes(member._id)) {
            event.participants.push(member._id);
        }

        // 4. Send Email
        const message = `
          <div style="font-family: Arial; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #4F46E5;">Entry Pass Confirmed! ✅</h2>
            <p>Hi ${member.name}, here is your ticket for <b>${event.title}</b>.</p>
            <p><b>Team:</b> ${team ? team.name : 'Solo'}</p>
            <p><b>Ticket ID:</b> ${ticket._id}</p>
            <br>
            <img src="cid:qr" width="180" style="border: 2px solid #333; padding: 5px; border-radius: 5px;" />
          </div>
        `;

        await sendEmail({
          email: member.email,
          subject: `🎟️ Ticket: ${event.title}`,
          message,
          attachments: [{
            filename: 'qr.png',
            content: qrImage.split("base64,")[1],
            encoding: 'base64',
            cid: 'qr'
          }]
        });

        results.push({ email: member.email, status: "Success" });

      } catch (err) {
        console.error(`❌ Failed for ${member.email}:`, err.message);
        results.push({ email: member.email, status: "Failed", error: err.message });
      }
    }

    await event.save();
    console.log("✅ Booking Completed Successfully.");
    res.status(201).json({ message: "Tickets Booked & Emailed!", results });

  } catch (error) {
    console.error("🔥 Server Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Ticket (Scanner Logic - No Changes needed, just standard)
const verifyTicket = async (req, res) => {
  try {
    const { qrData, eventId } = req.body; // eventId = Guard ne jo select kiya

    const cleanQR = qrData ? qrData.trim() : "";
    const cleanEventId = eventId ? eventId.trim() : "";

    console.log("🔍 Scanning:", cleanQR);

    if (!cleanQR || !cleanEventId) {
        return res.status(400).json({ message: "Missing QR Data or Event ID" });
    }

    let ticket = null;

    // 🔥 STRATEGY 1: PARSE JSON (Ye naya logic hai)
    try {
        const parsedData = JSON.parse(cleanQR);
        console.log("✅ JSON Detected:", parsedData);

        // Tumhare QR me 'userId' hai.
        // Logic: Aisa Ticket dhundo jisme User == userId AND Event == Guard's Selected Event
        if (parsedData.userId) {
            ticket = await Registration.findOne({ 
                user: parsedData.userId, 
                event: cleanEventId 
            }).populate('user').populate('event');
        }
        
    } catch (e) {
        console.log("ℹ️ Not a JSON, trying ID match...");
    }

    // 🔥 STRATEGY 2: DIRECT ID MATCH (Old QRs agar koi ho)
    if (!ticket && mongoose.Types.ObjectId.isValid(cleanQR)) {
        ticket = await Registration.findById(cleanQR).populate('user').populate('event');
    }

    // 🔥 STRATEGY 3: EXACT STRING MATCH
    if (!ticket) {
        ticket = await Registration.findOne({ qrCodeData: cleanQR }).populate('user').populate('event');
    }

    // --- CHECKS ---
    if (!ticket) {
        return res.status(404).json({ message: "❌ Invalid Ticket! Record Not Found." });
    }

    // Strict Event Check
    if (ticket.event._id.toString() !== cleanEventId) {
        return res.status(403).json({ 
            message: `⛔ Wrong Event! Ticket is for "${ticket.event.title}"` 
        });
    }

    if (ticket.hasAttended) {
        return res.status(400).json({ 
            message: `⚠️ ALREADY SCANNED!` 
        });
    }

    // --- SUCCESS ---
    ticket.hasAttended = true;
    ticket.checkInTime = Date.now();
    await ticket.save();

    console.log(`✅ Entry Granted: ${ticket.user.name}`);

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
    console.error("🔥 Verify Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


module.exports = { bookTicket, verifyTicket };