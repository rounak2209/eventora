const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Team = require('../models/Team'); 
const QRCode = require('qrcode');
const sendEmail = require('../utils/sendEmail');
const mongoose = require('mongoose');

// ==========================================
// 1. BOOK TICKET (Standardized QR Generation)
// ==========================================
const bookTicket = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    let membersToRegister = [];
    let teamId = null;

    if (event.isTeamEvent) {
      const team = await Team.findOne({ event: eventId, leader: userId }).populate('members'); 
      if (!team) return res.status(400).json({ message: "Team not found!" });
      membersToRegister = team.members;
      teamId = team._id;
    } else {
      membersToRegister = [req.user]; 
    }

    const results = [];

    for (const member of membersToRegister) {
      try {
        const existingReg = await Registration.findOne({ user: member._id, event: eventId });
        if (existingReg) {
            results.push({ email: member.email, status: "Already Registered" });
            continue; 
        }

        // 1. Registration Create
        const ticket = await Registration.create({
          user: member._id,
          event: eventId,
          team: teamId,
          paymentStatus: 'Paid',
          hasAttended: false
        });

        // 2. Generate QR JSON (Jo scanner padh raha hai)
        const qrPayload = {
            userId: member._id.toString(),
            eventId: eventId.toString(),
            teamId: teamId ? teamId.toString() : null,
            type: "GATE_PASS"
        };
        const qrData = JSON.stringify(qrPayload);
        
        ticket.qrCodeData = qrData;
        await ticket.save();

        // 3. Email Send (QR Image)
        const qrImage = await QRCode.toDataURL(qrData);
        const base64Data = qrImage.split(',')[1];

        const message = `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
            <h2 style="color: #4F46E5;">Hello ${member.name}, Ticket Confirmed! 🎉</h2>
            <p>Your registration for <b>${event.title}</b> is successful.</p>
            <br>
            <img src="cid:unique-qr-code" alt="QR Code" width="200" style="display:block; margin:auto;" />
            <p style="text-align:center; color: #555;"><b>Ticket ID:</b> ${ticket._id}</p>
          </div>
        `;

        await sendEmail({
          email: member.email,
          subject: `Ticket for ${event.title} 🎟️`,
          message,
          attachments: [{ filename: 'ticket-qr.png', content: base64Data, encoding: 'base64', cid: 'unique-qr-code' }]
        });

        results.push({ email: member.email, status: "Success" });

      } catch (err) {
        console.log(`Error:`, err.message);
        results.push({ email: member.email, status: "Failed" });
      }
    }
    res.status(201).json({ success: true, message: "Processed", results });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 2. VERIFY TICKET (Fixed for your JSON Format) ✅
// ==========================================
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