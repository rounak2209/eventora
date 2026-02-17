const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User'); 
const PDFDocument = require('pdfkit');
const sendEmail = require('../utils/sendEmail');

// ==========================================
// 1. HELPERS (PDF GRAPHICS & CONTENT) 🎨
// ==========================================

// Bar chart draw karne ka function (No changes to visual logic)
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
    doc.fillColor('#4F46E5').fontSize(22).text('EVENT ANALYTICS REPORT', { align: 'center' });
    doc.fontSize(14).fillColor('#1F2937').text(event ? event.title : 'General Overview', { align: 'center' });
    doc.fontSize(10).fillColor('#6B7280').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // 2. Attendance Summary Box
    doc.fontSize(12).fillColor('#111827').text('1. ATTENDANCE SUMMARY', { underline: true });
    doc.moveDown(0.5);
    doc.rect(50, 140, 500, 45).fillColor('#F9FAFB').strokeColor('#E5E7EB').fillAndStroke();
    
    doc.fillColor('#111827').fontSize(10);
    doc.text(`Total Registered: ${totalCount}`, 70, 158);
    doc.text(`Total Present: ${presentCount}`, 220, 158);
    doc.text(`Total Absent: ${absentCount}`, 400, 158);
    doc.moveDown(4);

    // 3. Demographic Graphs
    let yPos = 230;
    
    // Gender Breakdown
    doc.fontSize(12).fillColor('#4F46E5').text('2. GENDER DISTRIBUTION', 50, yPos);
    yPos += 25;
    Object.keys(genderStats).forEach(key => {
        drawBarChart(doc, key, genderStats[key], totalCount, 50, yPos, '#3B82F6');
        yPos += 20;
    });

    // Department Breakdown
    yPos += 30;
    doc.fontSize(12).fillColor('#4F46E5').text('3. DEPARTMENT-WISE PARTICIPATION', 50, yPos);
    yPos += 25;
    Object.keys(deptStats).slice(0, 10).forEach(key => { // Top 10 depts
        drawBarChart(doc, key, deptStats[key], totalCount, 50, yPos, '#F59E0B');
        yPos += 20;
    });

    // Year Breakdown
    yPos += 30;
    doc.fontSize(12).fillColor('#4F46E5').text('4. YEAR-WISE BREAKDOWN', 50, yPos);
    yPos += 25;
    Object.keys(yearStats).forEach(key => {
        drawBarChart(doc, key, yearStats[key], totalCount, 50, yPos, '#10B981');
        yPos += 20;
    });

    // 4. Detailed Attendee List (New Page)
    doc.addPage();
    doc.fontSize(16).fillColor('#111827').text('DETAILED ATTENDEE LOG', { align: 'center' });
    doc.moveDown();

    const tableTop = 100;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151');
    doc.text('Participant Name', 50, tableTop);
    doc.text('Dept', 210, tableTop);
    doc.text('Year', 320, tableTop);
    doc.text('Status', 460, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor('#D1D5DB').stroke();

    let rowY = tableTop + 25;
    doc.font('Helvetica');
    
    registrations.forEach(reg => {
        if (rowY > 720) { doc.addPage(); rowY = 50; }
        
        const userName = reg.user ? reg.user.name : 'Unknown';
        const userDept = reg.user?.department || 'N/A';
        const userYear = reg.user?.year || '-';

        doc.fillColor('#111827').text(userName, 50, rowY, { width: 150 });
        doc.text(userDept, 210, rowY, { width: 100 });
        doc.text(userYear, 320, rowY);
        
        if (reg.hasAttended) {
            doc.fillColor('#059669').text('PRESENT', 460, rowY);
        } else {
            doc.fillColor('#DC2626').text('ABSENT', 460, rowY);
        }
        
        rowY += 20;
    });
};

// ==========================================
// 2. HELPER: CALCULATE STATS (Common Logic)
// ==========================================
async function calculateEventStats(eventId) {
    let query = {};
    if (eventId && eventId !== 'all') {
        query = { event: eventId };
    }

    const registrations = await Registration.find(query)
      .populate('user', 'name email department year gender')
      .lean(); // Faster lookup for analytics

    const event = (eventId && eventId !== 'all') 
        ? await Event.findById(eventId).lean() 
        : { title: "Consolidated Events Analytics" };

    const totalCount = registrations.length;
    const presentCount = registrations.filter(r => r.hasAttended).length;
    const absentCount = totalCount - presentCount;

    let genderStats = { Male: 0, Female: 0, Other: 0 };
    let yearStats = {};
    let deptStats = {};

    registrations.forEach(reg => {
        if (!reg.user) return;

        // Gender Mapping
        const g = reg.user.gender || 'Other';
        if (genderStats[g] !== undefined) genderStats[g]++;
        else genderStats.Other++;
        
        // Year Mapping
        const y = reg.user.year || 'N/A';
        yearStats[y] = (yearStats[y] || 0) + 1;

        // Dept Mapping
        const d = reg.user.department || 'General';
        deptStats[d] = (deptStats[d] || 0) + 1;
    });

    return { event, totalCount, presentCount, absentCount, genderStats, yearStats, deptStats, registrations };
}

// ==========================================
// 3. API CONTROLLERS
// ==========================================

// @desc    JSON Stats for Dashboard Charts
const getEventAnalytics = async (req, res) => {
    try {
        const { eventId } = req.query;
        const data = await calculateEventStats(eventId);
        
        return res.status(200).json({
            success: true,
            stats: {
                total: data.totalCount,
                present: data.presentCount,
                absent: data.absentCount,
                gender: data.genderStats,
                departments: data.deptStats,
                years: data.yearStats
            }
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// @desc    Stream PDF Report
const downloadAnalyticsReport = async (req, res) => {
    try {
        const { eventId } = req.query;
        const data = await calculateEventStats(eventId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Report_${data.event.title.replace(/\s+/g, '_')}.pdf`);

        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res); 

        generatePDFContent(
            doc, data.event, data.totalCount, data.presentCount, 
            data.absentCount, data.genderStats, data.yearStats, 
            data.deptStats, data.registrations
        );
        doc.end();

    } catch (error) {
        console.error("PDF Export Error:", error);
        if (!res.headersSent) res.status(500).json({ message: "Failed to generate PDF report" });
    }
};

// @desc    Email PDF Report to Organizer
const emailAnalyticsReport = async (req, res) => {
    try {
        const { eventId } = req.body;
        const organizerEmail = req.user.email;

        const data = await calculateEventStats(eventId);

        const doc = new PDFDocument({ margin: 50 });
        let buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
            try {
                const pdfData = Buffer.concat(buffers);
                await sendEmail({
                    email: organizerEmail,
                    subject: `📊 Analytics Report: ${data.event.title}`,
                    message: `<h3>Analytics Report Attached</h3><p>Please find the participation data for <b>${data.event.title}</b>.</p>`,
                    attachments: [{ 
                        filename: `${data.event.title}_Analytics.pdf`, 
                        content: pdfData 
                    }]
                });
                return res.status(200).json({ success: true, message: "Report has been emailed! 📧" });
            } catch (err) {
                console.error("Email Error:", err);
                return res.status(500).json({ message: "Failed to send report via email." });
            }
        });

        generatePDFContent(
            doc, data.event, data.totalCount, data.presentCount, 
            data.absentCount, data.genderStats, data.yearStats, 
            data.deptStats, data.registrations
        );
        doc.end();

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { getEventAnalytics, downloadAnalyticsReport, emailAnalyticsReport };