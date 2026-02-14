const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User'); // User model ki zaroorat padegi
const PDFDocument = require('pdfkit');
const sendEmail = require('../utils/sendEmail');

// ==========================================
// 1. HELPERS (PDF GRAPHICS & CONTENT) - OLD CODE PRESERVED 🎨
// ==========================================

const drawBarChart = (doc, label, count, total, x, y, color) => {
    const barWidth = 150; 
    const percentage = total > 0 ? (count / total) : 0;
    const actualWidth = barWidth * percentage;

    // Label
    doc.fontSize(10).fillColor('black').text(label, x, y);
    // Background Bar
    doc.rect(x + 60, y - 2, barWidth, 10).fillColor('#f0f0f0').fill();
    // Foreground Bar (Color)
    if (actualWidth > 0) {
        doc.rect(x + 60, y - 2, actualWidth, 10).fillColor(color).fill();
    }
    // Count
    doc.fillColor('black').text(`${count}`, x + 60 + barWidth + 10, y);
};

const generatePDFContent = (doc, event, totalCount, presentCount, absentCount, genderStats, yearStats, deptStats, registrations) => {
    // 1. Header
    doc.fillColor('#4F46E5').fontSize(20).text('EVENT ANALYTICS REPORT', { align: 'center' });
    doc.fontSize(12).fillColor('black').text(event ? event.title : 'All Events', { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toDateString()}`, { align: 'center' });
    doc.moveDown(1.5);

    // 2. Attendance Summary Box
    doc.fontSize(12).text('1. ATTENDANCE SUMMARY', { underline: true });
    doc.moveDown(0.5);
    doc.rect(50, 140, 500, 40).fillColor('#f9f9f9').fill();
    doc.fillColor('black').fontSize(10);
    doc.text(`Total Registered: ${totalCount}`, 70, 155);
    doc.text(`Total Present: ${presentCount}`, 220, 155);
    doc.text(`Total Absent: ${absentCount}`, 400, 155);
    doc.moveDown(4);

    // 3. Graphs
    let yPos = 220;
    
    // Gender
    doc.fontSize(12).fillColor('#4F46E5').text('2. GENDER BREAKDOWN', 50, yPos);
    yPos += 20;
    Object.keys(genderStats).forEach(key => {
        if (genderStats[key] >= 0) { // Show all even if 0
            drawBarChart(doc, key, genderStats[key], totalCount, 50, yPos, '#3B82F6');
            yPos += 20;
        }
    });

    // Department
    yPos += 20;
    doc.fontSize(12).fillColor('#4F46E5').text('3. DEPARTMENT BREAKDOWN', 50, yPos);
    yPos += 20;
    Object.keys(deptStats).forEach(key => {
        drawBarChart(doc, key, deptStats[key], totalCount, 50, yPos, '#F59E0B');
        yPos += 20;
    });

    // Year
    yPos += 20;
    doc.fontSize(12).fillColor('#4F46E5').text('4. YEAR BREAKDOWN', 50, yPos);
    yPos += 20;
    Object.keys(yearStats).forEach(key => {
        drawBarChart(doc, key, yearStats[key], totalCount, 50, yPos, '#10B981');
        yPos += 20;
    });

    // 4. Attendee List Table
    doc.addPage();
    doc.fontSize(14).fillColor('black').text('DETAILED ATTENDEE LIST', { align: 'center' });
    doc.moveDown();

    const tableTop = 100;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Name', 50, tableTop);
    doc.text('Dept', 200, tableTop);
    doc.text('Year', 300, tableTop);
    doc.text('Status', 450, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let rowY = tableTop + 25;
    doc.font('Helvetica');
    
    registrations.forEach(reg => {
        if (rowY > 700) { doc.addPage(); rowY = 50; }
        // Safe check for user existence
        const userName = reg.user ? reg.user.name : 'Unknown User';
        const userDept = (reg.user && reg.user.department) ? reg.user.department : '-';
        const userYear = (reg.user && reg.user.year) ? reg.user.year : '-';

        doc.fillColor('black').text(userName, 50, rowY, { width: 140 });
        doc.text(userDept, 200, rowY);
        doc.text(userYear, 300, rowY);
        
        if (reg.hasAttended) doc.fillColor('green').text('Present', 450, rowY);
        else doc.fillColor('red').text('Absent', 450, rowY);
        
        rowY += 20;
    });
};

// ==========================================
// 2. HELPER: CALCULATE STATS (Common Logic) 🧮
// ==========================================
async function calculateEventStats(eventId) {
    // Agar eventId nahi mila, toh shuru ka koi bhi event lelo (Demo purpose)
    let query = {};
    if (eventId) {
        query = { event: eventId };
    }

    const registrations = await Registration.find(query)
      .populate('user', 'name email department year gender');

    const event = eventId ? await Event.findById(eventId) : { title: "All Events Analytics" };

    const totalCount = registrations.length;
    const presentCount = registrations.filter(r => r.hasAttended).length;
    const absentCount = totalCount - presentCount;

    let genderStats = { Male: 0, Female: 0 };
    let yearStats = {};
    let deptStats = {};

    registrations.forEach(reg => {
        if (!reg.user) return; // Skip if user deleted

        // Gender
        const g = reg.user.gender;
        if (g === 'Male') genderStats.Male++;
        else if (g === 'Female') genderStats.Female++;
        
        // Year
        const y = reg.user.year || 'Unknown';
        yearStats[y] = (yearStats[y] || 0) + 1;

        // Dept
        const d = reg.user.department || 'General';
        deptStats[d] = (deptStats[d] || 0) + 1;
    });

    return { event, totalCount, presentCount, absentCount, genderStats, yearStats, deptStats, registrations };
}

// ==========================================
// 3. API CONTROLLERS 🚀
// ==========================================

// @desc    Get JSON Stats for React Dashboard (Pie Charts etc)
// @route   GET /api/analytics/stats?eventId=...
const getEventAnalytics = async (req, res) => {
    try {
        const { eventId } = req.query; // Query param se ID uthaega
        const data = await calculateEventStats(eventId);
        
        res.status(200).json({
            success: true,
            stats: {
                total: data.totalCount,
                present: data.presentCount,
                absent: data.absentCount,
                male: data.genderStats.Male,
                female: data.genderStats.Female,
                departments: data.deptStats,
                years: data.yearStats
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Download PDF Report (Browser Stream)
// @route   GET /api/analytics/download-report?eventId=...
const downloadAnalyticsReport = async (req, res) => {
    try {
        const { eventId } = req.query;
        const data = await calculateEventStats(eventId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${data.event.title}_Report.pdf`);

        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res); // Browser mein download shuru

        generatePDFContent(
            doc, 
            data.event, 
            data.totalCount, 
            data.presentCount, 
            data.absentCount, 
            data.genderStats, 
            data.yearStats, 
            data.deptStats, 
            data.registrations
        );
        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "PDF Generation Error" });
    }
};

// @desc    Email PDF Report to Organizer
// @route   POST /api/analytics/send-report
const emailAnalyticsReport = async (req, res) => {
    try {
        const { eventId } = req.body; // Body se ID lega
        const organizerEmail = req.user.email; // Auth Middleware se email

        const data = await calculateEventStats(eventId);

        const doc = new PDFDocument({ margin: 50 });
        let buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
            const pdfData = Buffer.concat(buffers);
            try {
                await sendEmail({
                    email: organizerEmail,
                    subject: `📈 Report: ${data.event.title}`,
                    message: `<p>Attached is the Analytics Report for <b>${data.event.title}</b>.</p>`,
                    attachments: [{ filename: `${data.event.title}_Report.pdf`, content: pdfData }]
                });
                res.status(200).json({ success: true, message: "Report emailed successfully!" });
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: "Email failed to send" });
            }
        });

        generatePDFContent(
            doc, 
            data.event, 
            data.totalCount, 
            data.presentCount, 
            data.absentCount, 
            data.genderStats, 
            data.yearStats, 
            data.deptStats, 
            data.registrations
        );
        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getEventAnalytics, downloadAnalyticsReport, emailAnalyticsReport };