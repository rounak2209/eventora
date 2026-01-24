const Registration = require('../models/Registration'); // Ticket ka Model
const QRCode = require('qrcode'); // QR library
const sendEmail = require('../utils/sendEmail'); // Jo abhi banaya

// @desc    Book Ticket & Send QR via Email
// @route   POST /api/ticket/book
const bookTicket = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user._id; // Ye login user ki ID hai (Middleware se aayi)
    const userEmail = req.user.email;

    // 1. Check: Kya banda pehle se booked hai?
    const existingReg = await Registration.findOne({ user: userId, event: eventId });
    if (existingReg) {
      return res.status(400).json({ message: 'You have already booked this event! 🚫' });
    }

    // 2. Unique QR String Generate karo
    // Logic: UserID + EventID + Time (Taaki kabhi duplicate na ho)
    const qrData = `${userId}-${eventId}-${Date.now()}`;

    // 3. String ko QR Image (Base64) mein convert karo
    const qrImage = await QRCode.toDataURL(qrData);

    // 4. Database mein Ticket Save karo
    const ticket = await Registration.create({
      user: userId,
      event: eventId,
      qrCodeId: qrData,
      paymentStatus: 'Paid', // Abhi ke liye Paid maan lete hain
      hasAttended: false
    });

    // 5. Email Bhejo (QR Code attach karke)
    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
        <h2 style="color: #4F46E5;">Ticket Confirmed! 🎉</h2>
        <p>Hello,</p>
        <p>Your seat for the event is confirmed. Please show the attached <b>QR Code</b> at the entry gate.</p>
        <p style="background: #f4f4f4; padding: 10px;"><b>Ticket ID:</b> ${ticket._id}</p>
        <p>See you there!<br>- Team Vortex</p>
      </div>
    `;

    try {
      await sendEmail({
        email: userEmail,
        subject: 'Your Vortex Event Ticket 🎟️',
        message,
        attachments: [
          {
            filename: 'ticket-qr.png',
            content: qrImage.split("base64,")[1], // Base64 header hata diya
            encoding: 'base64'
          }
        ]
      });

      res.status(201).json({ 
        message: 'Ticket Booked & Email Sent Successfully! 📧', 
        ticket 
      });

    } catch (emailError) {
      console.log("Email Error:", emailError);
      // Agar email fail hua, tab bhi ticket toh ban gaya hai
      res.status(201).json({ 
        message: 'Ticket Booked (But Email Failed - Check Console)', 
        ticket 
      });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { bookTicket };