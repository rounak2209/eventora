const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Ya jo bhi service use kar rahe ho
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: options.email,
    subject: options.subject,
    html: options.message,
    attachments: options.attachments // 👈 Ye line add karna zaroori hai
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;