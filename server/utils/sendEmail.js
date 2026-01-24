const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Setup Transporter (Ye Gmail se connect karega)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 2. Email ka content set karo
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message, // HTML message (sundar dikhne ke liye)
    attachments: options.attachments, // QR Code yaha chipkega
  };

  // 3. Email Bhej do!
  await transporter.sendMail(message);
};

module.exports = sendEmail;