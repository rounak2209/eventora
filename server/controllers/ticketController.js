const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Team = require('../models/Team'); 
const QRCode = require('qrcode');
const sendEmail = require('../utils/sendEmail');

// ==========================================
// 1. BOOK TICKET (Email + QR Generation)
// ==========================================
// @desc    Bulk Book Tickets for Team (or Solo)
// @route   POST /api/ticket/book
const bookTicket = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user._id;

    // 1. Event ki details laao
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    let membersToRegister = [];
    let team = null;

    // --- CASE A: TEAM EVENT ---
    if (event.isTeamEvent) {
      // Check karo kya ye banda Leader hai?
      team = await Team.findOne({ event: eventId, leader: userId })
        .populate('members'); 

      if (!team) {
        return res.status(400).json({ message: "Aap Team Leader nahi hain ya Team nahi banayi hai!" });
      }

      membersToRegister = team.members;
    
    // --- CASE B: SOLO EVENT ---
    } else {
      membersToRegister = [req.user]; 
    }

    // --- MAIN LOOP: Sabke liye Ticket Banao ---
    const results = [];

    for (const member of membersToRegister) {
      try {
        // A. Check agar member pehle se registered hai
        const existingReg = await Registration.findOne({ user: member._id, event: eventId });
        
        if (existingReg) {
            results.push({ email: member.email, status: "Already Registered" });
            continue; 
        }

        // B. Unique QR Data (Member ID + Event ID + Time)
        const qrData = `${member._id}-${eventId}-${Date.now()}`;
        const qrImage = await QRCode.toDataURL(qrData);

        // C. Ticket Database mein Save karo
        const ticket = await Registration.create({
          user: member._id,
          event: eventId,
          team: event.isTeamEvent ? team._id : null,
          qrCodeData: qrData,
          paymentStatus: 'Paid',
          hasAttended: false
        });

        // D. Email Bhejo
        const message = `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
            <h2 style="color: #4F46E5;">Hello ${member.name}, Ticket Confirmed! 🎉</h2>
            <p>Your registration for <b>${event.title}</b> is successful.</p>
            <p>Here is your unique Entry Pass. Show this QR Code at the gate.</p>
            <br>
            <img src="cid:unique-qr-code" alt="QR Code" width="200" />
            <p><b>Ticket ID:</b> ${ticket._id}</p>
          </div>
        `;

        await sendEmail({
          email: member.email,
          subject: `Ticket for ${event.title} 🎟️`,
          message,
          attachments: [
            {
              filename: 'ticket-qr.png',
              content: qrImage.split("base64,")[1],
              encoding: 'base64',
              cid: 'unique-qr-code'
            }
          ]
        });

        results.push({ email: member.email, status: "Success" });

      } catch (err) {
        console.log(`Error for ${member.email}:`, err.message);
        results.push({ email: member.email, status: "Failed", error: err.message });
      }
    }

    res.status(201).json({
      message: "Bulk Registration Processed",
      results
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 2. VERIFY TICKET (Scanner Logic) - NEW 🚀
// ==========================================
// @desc    Verify Ticket at Gate
// @route   POST /api/ticket/verify
const verifyTicket = async (req, res) => {
  try {
    const { qrData } = req.body; // Scanner se ye data aayega

    // 1. Database mein dhundo
    const ticket = await Registration.findOne({ qrCodeData: qrData })
      .populate('user', 'name email department'); // User ki details lao

    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: "❌ Invalid Ticket! (Fake hai ya Database mein nahi hai)" 
      });
    }

    // 2. Check karo: Kya ye ticket pehle hi use ho chuka hai?
    if (ticket.hasAttended) {
      return res.status(400).json({ 
        success: false, 
        message: "⚠️ Ticket Already Used! (Ye banda pehle hi entry le chuka hai)" 
      });
    }

    // 3. Sab sahi hai -> Entry Confirm karo aur Attendance mark karo
    ticket.hasAttended = true;
    ticket.checkInTime = Date.now();
    await ticket.save();

    res.status(200).json({
      success: true,
      message: "✅ Entry Granted!",
      student: {
        name: ticket.user.name,
        department: ticket.user.department,
        email: ticket.user.email
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Dono functions ko export karo
module.exports = { bookTicket, verifyTicket };