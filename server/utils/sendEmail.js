const axios = require('axios');

const sendEmail = async (options) => {
  try {
    let formattedAttachments = [];
    
    // 🔥 Universal Attachment Format Converter (For PDF & QR Codes)
    if (options.attachments && options.attachments.length > 0) {
      formattedAttachments = options.attachments.map((att) => {
        let brevoAtt = { name: att.filename || 'document.pdf' };
        
        // 1. Agar content pehle se Base64 string hai (Jaise QR in auth/ticket)
        if (typeof att.content === 'string') {
          brevoAtt.content = att.content;
        } 
        // 2. Agar content Buffer hai (Jaise PDF in cert/analytics)
        else if (Buffer.isBuffer(att.content)) {
          brevoAtt.content = att.content.toString('base64');
        } 
        // 3. Fallback for raw buffer data
        else {
           brevoAtt.content = Buffer.from(att.content).toString('base64');
        }
        
        return brevoAtt;
      });
    }

    const emailData = {
      sender: {
        name: process.env.FROM_NAME || 'Campus Connect',
        email: process.env.EMAIL_USER // Dhyan rakhna ye q954830@gmail.com Brevo pe verify hona chahiye
      },
      to: [{ email: options.email }],
      subject: options.subject,
      htmlContent: options.message,
    };

    if (formattedAttachments.length > 0) {
      emailData.attachment = formattedAttachments;
    }

    // 🚀 Sending via Brevo REST API (100% Timeout Proof on Render)
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      emailData,
      {
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json',
        },
      }
    );

    console.log(`✅ Mail successfully sent to: ${options.email}`);
    return response.data;

  } catch (error) {
    console.error('❌ Email sending failed:', error?.response?.data || error.message);
    throw error; // Let the controller know it failed
  }
};

module.exports = sendEmail;