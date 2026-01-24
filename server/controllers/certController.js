const Registration = require('../models/Registration');
const { generateCertificatePDF } = require('../utils/generateCert');
const sendEmail = require('../utils/sendEmail');

// 1. ISSUE CERTIFICATE & SEND EMAIL
// Route: POST /api/certificate/issue
const User = require('../models/User'); // User model import karna mat bhoolna

// 1. ISSUE CERTIFICATE & EMAIL
const issueCertificate = async (req, res) => {
  try {
    const { email, eventId } = req.body;

    // STEP 1: User aur Registration Dhundo
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    const registration = await Registration.findOne({ 
      user: user._id, 
      event: eventId 
    })
    .populate('user', 'name email')
    .populate('event', 'title date')
    .populate('team', 'name');

    if (!registration) {
      return res.status(404).json({ message: "User is not registered for this event." });
    }

    // STEP 2: Certificate ID Generate Karo
    if (!registration.certificateId) {
      registration.certificateId = "CERT-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
      registration.issuedAt = Date.now();
      await registration.save();
    }

    // STEP 3: PDF Data Prepare Karo
    const certData = {
      studentName: registration.user.name,
      teamName: registration.team ? registration.team.name : null,
      eventName: registration.event.title,
      date: registration.event.date,
      certificateId: registration.certificateId,
      verifyUrl: `http://localhost:5000/api/certificate/verify/${registration.certificateId}`
    };

    // --- ✨ MAIN CHANGE: EMAIL LOGIC ---
    
    // PDF ke tukde (Chunks) jama karne ke liye array
    const buffers = [];

    generateCertificatePDF(certData, 
      (chunk) => {
        buffers.push(chunk); // 1. Data ko memory me store karo
      },
      async () => {
        // 2. Jab PDF poora ban jaye
        const pdfBuffer = Buffer.concat(buffers);

        try {
            // 3. Email Send Karo
            await sendEmail({
                email: user.email, // User ko bhejo
                subject: `Certificate of Participation - ${registration.event.title}`,
                message: `
                  <h3>Congratulations ${user.name}!</h3>
                  <p>Thank you for participating in <b>${registration.event.title}</b>.</p>
                  <p>Please find your official certificate attached below.</p>
                  <br>
                  <p>Certificate ID: ${registration.certificateId}</p>
                `,
                attachments: [
                    {
                        filename: `Certificate-${user.name}.pdf`, // File ka naam
                        content: pdfBuffer, // Asli PDF Data
                        contentType: 'application/pdf'
                    }
                ]
            });

            // 4. Admin ko success message do
            res.status(200).json({ 
              message: `Certificate sent to ${user.email} successfully! 📧`,
              certificateId: registration.certificateId
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Email sending failed: " + error.message });
        }
      }
    );

  } catch (error) {
    if(!res.headersSent) res.status(500).json({ message: error.message });
  }
};


// 2. VERIFY CERTIFICATE (Public URL - Fake Rokne ke liye)
// Route: GET /api/certificate/verify/:certId
const verifyCertificate = async (req, res) => {
  try {
    const { certId } = req.params;

    const reg = await Registration.findOne({ certificateId: certId })
      .populate('user', 'name')
      .populate('event', 'title');

    if (!reg) {
      return res.status(404).json({ valid: false, message: "❌ FAKE Certificate! Record not found." });
    }

    res.json({
      valid: true,
      message: "✅ Verified Original Certificate",
      details: {
        student: reg.user.name,
        event: reg.event.title,
        issuedOn: reg.issuedAt
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { issueCertificate, verifyCertificate };