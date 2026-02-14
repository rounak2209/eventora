const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User'); 
const { generateCertificatePDF } = require('../utils/generateCert'); // Ensure path is correct
const sendEmail = require('../utils/sendEmail');


// 1. ISSUE CERTIFICATE & SEND EMAIL
// Route: POST /api/certificate/issue

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


const issueAllCertificates = async (req, res) => {
  try {
    const { eventId } = req.body;

    // 1. Event Check
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // 2. Sirf unko dhundo jo PRESENT the aur jinhe certificate ABHI TAK NAHI mila
    const attendees = await Registration.find({ 
      event: eventId, 
      hasAttended: true,
      // certificateId: { $exists: false } // Agar chaho to duplicate rokne ke liye uncomment kar dena
    }).populate('user').populate('team');

    if (attendees.length === 0) {
      return res.status(400).json({ message: "No attended users found pending for certificates." });
    }

    let sentCount = 0;

    // 3. Loop chalao aur sabko bhejo
    // Note: Production mein ise Queue (BullMQ) se karna chahiye, par project ke liye loop chalega.
    for (const reg of attendees) {
        if (!reg.user) continue;

        // ID Generate
        if (!reg.certificateId) {
            reg.certificateId = `CERT-${eventId.slice(-4)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            reg.issuedAt = Date.now();
            await reg.save();
        }

        // PDF Data Prep
        const certData = {
            studentName: reg.user.name,
            eventName: event.title,
            date: new Date(event.date).toLocaleDateString(),
            teamName: reg.team ? reg.team.name : null,
            certificateId: reg.certificateId
        };

        // PDF Generation & Email (Promise wrapper taaki wait kar sakein)
        await new Promise((resolve, reject) => {
            let buffers = [];
            generateCertificatePDF(
                certData, 
                (chunk) => buffers.push(chunk), // Data Callback
                async () => { // End Callback
                    try {
                        const pdfBuffer = Buffer.concat(buffers);
                        await sendEmail({
                            email: reg.user.email,
                            subject: `🎓 Certificate: ${event.title}`,
                            message: `<p>Congratulations <b>${reg.user.name}</b>! <br> You have successfully attended <b>${event.title}</b>. Your certificate is attached.</p>`,
                            attachments: [{ filename: `${reg.user.name}_Certificate.pdf`, content: pdfBuffer }]
                        });
                        resolve();
                    } catch (err) {
                        console.error(`Failed for ${reg.user.email}`, err);
                        resolve(); // Fail hone par bhi continue karo
                    }
                }
            );
        });

        sentCount++;
    }

    res.json({ message: `Success! Certificates sent to ${sentCount} attendees. 🚀` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Bulk issue failed: " + error.message });
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

module.exports = { issueCertificate, verifyCertificate ,issueAllCertificates };