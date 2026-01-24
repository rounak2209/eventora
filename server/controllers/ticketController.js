const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Team = require('../models/Team'); // Team Model chahiye
const QRCode = require('qrcode');
const sendEmail = require('../utils/sendEmail');

// @desc    Bulk Book Tickets for Team (or Solo)
// @route   POST /api/ticket/book
const bookTicket = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user._id;

    // 1. Event ki details laao (Pata karne ke liye ki Team Event hai ya Solo)
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    let membersToRegister = [];
    let team = null;
    // --- CASE A: TEAM EVENT ---
    if (event.isTeamEvent) {
      // 1. Check karo kya ye banda Leader hai?
       team = await Team.findOne({ event: eventId, leader: userId })
        .populate('members'); // ✨ Members ka Email nikalne ke liye populate zaruri hai

      if (!team) {
        return res.status(400).json({ message: "Aap Team Leader nahi hain ya Team nahi banayi hai!" });
      }

      // Poori team ko list mein daal do
      membersToRegister = team.members;
    
    // --- CASE B: SOLO EVENT ---
    } else {
      // Sirf current user ko list mein daalo
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
            continue; // Skip karo aur agle member par jao
        }

        // B. Unique QR Data (Member ID + Event ID)
        const qrData = `${member._id}-${eventId}-${Date.now()}`;
        const qrImage = await QRCode.toDataURL(qrData);

        // C. Ticket Database mein Save karo
        const ticket = await Registration.create({
          user: member._id,
          event: eventId,
          team: event.isTeamEvent ? team._id : null, // Agar team hai to ID dalo
          qrCodeData: qrData,
          paymentStatus: 'Paid',
          hasAttended: false
        });

        // D. Email Bhejo (Har member ko alag mail)
        const message = `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
            <h2 style="color: #4F46E5;">Hello ${member.name}, Ticket Confirmed! 🎉</h2>
            <p>Your team leader has registered for <b>${event.title}</b>.</p>
            <p>Here is your unique Entry Pass. Show this QR Code at the gate.</p>
            <br>
            <img src="cid:unique-qr-code" alt="QR Code" width="200" />
            <p><b>Ticket ID:</b> ${ticket._id}</p>
          </div>
        `;

        await sendEmail({
          email: member.email, // ✨ Member ka email
          subject: `Ticket for ${event.title} 🎟️`,
          message,
          attachments: [
            {
              filename: 'ticket-qr.png',
              content: qrImage.split("base64,")[1],
              encoding: 'base64',
              cid: 'unique-qr-code' // Email body me image dikhane ke liye
            }
          ]
        });

        results.push({ email: member.email, status: "Success" });

      } catch (err) {
        console.log(`Error for ${member.email}:`, err.message);
        results.push({ email: member.email, status: "Failed", error: err.message });
      }
    }

    // Final Response Leader ko
    res.status(201).json({
      message: "Bulk Registration Processed",
      results // Leader dekh payega kiska fail hua kiska pass
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { bookTicket };