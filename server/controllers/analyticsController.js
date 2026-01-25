const Registration = require('../models/Registration');
const Event = require('../models/Event');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const sendEmail = require('../utils/sendEmail');

// --- Helper: PDF Bar Chart Draw karne ke liye ---
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

// --- Helper: PDF Content Generate karne ke liye (Taaki code repeat na ho) ---
const generatePDFContent = (doc, event, totalCount, presentCount, absentCount, genderStats, yearStats, deptStats, registrations) => {
    // 1. Header
    doc.fillColor('#4F46E5').fontSize(20).text('EVENT ANALYTICS REPORT', { align: 'center' });
    doc.fontSize(12).fillColor('black').text(event.title, { align: 'center' });
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
        if (genderStats[key] > 0) {
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
        doc.fillColor('black').text(reg.user.name, 50, rowY, { width: 140 });
        doc.text(reg.user.department || '-', 200, rowY);
        doc.text(reg.user.year || '-', 300, rowY);
        
        if (reg.hasAttended) doc.fillColor('green').text('Present', 450, rowY);
        else doc.fillColor('red').text('Absent', 450, rowY);
        
        rowY += 20;
    });
};


// @desc    Email PDF Report + Send JSON Data
// @route   POST /api/analytics/report/email
const emailAnalyticsReport = async (req, res) => {
  try {
    const { eventId } = req.body;
    const organizerEmail = req.user.email;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const registrations = await Registration.find({ event: eventId })
      .populate('user', 'name email department year gender');

    // Stats Logic
    const totalCount = registrations.length;
    const presentCount = registrations.filter(r => r.hasAttended).length;
    const absentCount = totalCount - presentCount;

    let genderStats = { Male: 0, Female: 0, Other: 0 };
    let yearStats = {};
    let deptStats = {};

    registrations.forEach(reg => {
        const g = reg.user.gender || 'Other';
        if (genderStats[g] !== undefined) genderStats[g]++; else genderStats.Other++;
        yearStats[reg.user.year || 'Unknown'] = (yearStats[reg.user.year || 'Unknown'] || 0) + 1;
        deptStats[reg.user.department || 'General'] = (deptStats[reg.user.department || 'General'] || 0) + 1;
    });

    // PDF Create
    const doc = new PDFDocument({ margin: 50 });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);
      try {
        await sendEmail({
          email: organizerEmail,
          subject: `📈 Report: ${event.title}`,
          message: `<p>Attached is the Analytics Report for <b>${event.title}</b>.</p>`,
          attachments: [{ filename: `${event.title}_Report.pdf`, content: pdfData }]
        });

        // JSON Response bhi bhej rahe hain (Jo tumne manga tha)
        return res.status(200).json({ 
            success: true, 
            message: "Report PDF Sent to Email! 📧",
            analytics: {
                summary: { total: totalCount, present: presentCount, absent: absentCount },
                demographics: { gender: genderStats, year: yearStats, department: deptStats }
            }
        });
      } catch (err) { return res.status(500).json({ message: "Email failed" }); }
    });

    // Call Helper to fill PDF
    generatePDFContent(doc, event, totalCount, presentCount, absentCount, genderStats, yearStats, deptStats, registrations);
    doc.end();

  } catch (error) { res.status(500).json({ message: error.message }); }
};


// @desc    Download PDF Report (Directly)
// @route   GET /api/analytics/report/download/:eventId
const downloadAnalyticsReport = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const registrations = await Registration.find({ event: eventId })
      .populate('user', 'name email department year gender');

    // Stats Logic (Same as above)
    const totalCount = registrations.length;
    const presentCount = registrations.filter(r => r.hasAttended).length;
    const absentCount = totalCount - presentCount;
    let genderStats = { Male: 0, Female: 0, Other: 0 };
    let yearStats = {};
    let deptStats = {};

    registrations.forEach(reg => {
        const g = reg.user.gender || 'Other';
        if (genderStats[g] !== undefined) genderStats[g]++; else genderStats.Other++;
        yearStats[reg.user.year || 'Unknown'] = (yearStats[reg.user.year || 'Unknown'] || 0) + 1;
        deptStats[reg.user.department || 'General'] = (deptStats[reg.user.department || 'General'] || 0) + 1;
    });

    // Headers set karo PDF ke liye
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${event.title}_Report.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res); // Direct response mein bhejo

    generatePDFContent(doc, event, totalCount, presentCount, absentCount, genderStats, yearStats, deptStats, registrations);
    doc.end();

  } catch (error) { res.status(500).json({ message: "PDF Error" }); }
};

// @desc    Simple Analytics for Dashboard
const getEventAnalytics = async (req, res) => {
    // Ye simple wala hi rakhte hain dashboard graphs ke liye
    try {
        const { eventId } = req.params;
        const total = await Registration.countDocuments({ event: eventId });
        res.json({ success: true, total });
    } catch(err) { res.status(500).json({error: err.message}) }
};

module.exports = { getEventAnalytics, emailAnalyticsReport, downloadAnalyticsReport };