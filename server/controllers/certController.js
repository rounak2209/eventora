const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const { generateCertificatePDF } = require('../utils/generateCert'); 
const sendEmail = require('../utils/sendEmail');

// ============================================================
// 1. ISSUE SINGLE CERTIFICATE & EMAIL
// ============================================================
const issueCertificate = async (req, res) => {
  try {
    const { email, eventId } = req.body;

    // STEP 1: User aur Registration lookup
    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(404).json({ message: "No user found with this email" });

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

    // STEP 2: Generate Unique Certificate ID if not exists
    if (!registration.certificateId) {
      registration.certificateId = `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      registration.issuedAt = Date.now();
      await registration.save();
    }

    // STEP 3: Prepare PDF Data
    const certData = {
      studentName: registration.user.name,
      teamName: registration.team ? registration.team.name : null,
      eventName: registration.event.title,
      date: registration.event.date,
      certificateId: registration.certificateId,
      verifyUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/certificate/verify/${registration.certificateId}`
    };

    // STEP 4: Generate PDF into Buffer & Send
    const buffers = [];
    generateCertificatePDF(certData, 
      (chunk) => buffers.push(chunk), // Data accumulator
      async () => { // End callback
        try {
            const pdfBuffer = Buffer.concat(buffers);
            
            await sendEmail({
                email: user.email,
                subject: `🎓 Certificate of Participation - ${registration.event.title}`,
                message: `
                  <div style="font-family: sans-serif; line-height: 1.6;">
                    <h2>Congratulations ${user.name}!</h2>
                    <p>We are pleased to inform you that your official certificate for <b>${registration.event.title}</b> is now available.</p>
                    <p><b>Certificate ID:</b> ${registration.certificateId}</p>
                    <p>You can find the PDF attached to this email.</p>
                    <br>
                    <p>Best Regards,<br>Team Eventora</p>
                  </div>
                `,
                attachments: [
                    {
                        filename: `Certificate_${user.name.replace(/\s+/g, '_')}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            });

            res.status(200).json({ 
              message: `Certificate sent to ${user.email} successfully! 📧`,
              certificateId: registration.certificateId
            });

        } catch (error) {
            console.error("Email Error:", error);
            if (!res.headersSent) res.status(500).json({ message: "PDF ready but Email failed" });
        }
      }
    );

  } catch (error) {
    console.error("Issue Certificate Error:", error);
    if (!res.headersSent) res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 2. BULK ISSUE CERTIFICATES (For all present attendees)
// ============================================================
const issueAllCertificates = async (req, res) => {
  try {
    const { eventId } = req.body;

    const event = await Event.findById(eventId).lean();
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Sirf unhe dhundo jo Present the
    const attendees = await Registration.find({ 
      event: eventId, 
      hasAttended: true 
    }).populate('user').populate('team');

    if (attendees.length === 0) {
      return res.status(400).json({ message: "No attended users found for this event." });
    }

    let sentCount = 0;

    // Serial processing to maintain server stability
    for (const reg of attendees) {
        if (!reg.user?.email) continue;

        // Generate ID if missing
        if (!reg.certificateId) {
            reg.certificateId = `CERT-${eventId.slice(-4)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            reg.issuedAt = Date.now();
            await reg.save();
        }

        const certData = {
            studentName: reg.user.name,
            eventName: event.title,
            date: new Date(event.date).toLocaleDateString(),
            teamName: reg.team ? reg.team.name : null,
            certificateId: reg.certificateId
        };

        // Promise wrapper for PDF generation in loop
        await new Promise((resolve) => {
            let buffers = [];
            generateCertificatePDF(certData, 
                (chunk) => buffers.push(chunk),
                async () => {
                    try {
                        const pdfBuffer = Buffer.concat(buffers);
                        await sendEmail({
                            email: reg.user.email,
                            subject: `🎓 Your Certificate for ${event.title}`,
                            message: `<p>Hi <b>${reg.user.name}</b>, <br>Please find your attached certificate for attending ${event.title}.</p>`,
                            attachments: [{ filename: `Certificate_${reg.user.name}.pdf`, content: pdfBuffer }]
                        });
                        sentCount++;
                        resolve();
                    } catch (err) {
                        console.error(`Failed for ${reg.user.email}`, err.message);
                        resolve(); // Continue even if one fails
                    }
                }
            );
        });
    }

    res.json({ message: `Bulk process complete. ${sentCount} certificates sent! 🚀` });

  } catch (error) {
    console.error("Bulk Issue Error:", error);
    res.status(500).json({ message: "Bulk issue failed: " + error.message });
  }
};

// ============================================================
// 3. VERIFY CERTIFICATE (Public Verification URL)
// ============================================================
const verifyCertificate = async (req, res) => {
  try {
    const { certId } = req.params;

    const reg = await Registration.findOne({ certificateId: certId })
      .populate('user', 'name department year')
      .populate('event', 'title date venue');

    if (!reg) {
      return res.status(404).json({ valid: false, message: "❌ Invalid Certificate! No record found." });
    }

    res.json({
      valid: true,
      message: "✅ Verified Original Certificate",
      details: {
        student: reg.user.name,
        department: reg.user.department,
        event: reg.event.title,
        date: reg.event.date,
        venue: reg.event.venue,
        issuedOn: reg.issuedAt
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { issueCertificate, verifyCertificate, issueAllCertificates };