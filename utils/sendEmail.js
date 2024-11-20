const nodemailer = require("nodemailer");
const env = require("dotenv");

env.config();

const sendEmail = async ({ subject, customizedMessage, send_to, sent_from, attachment }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const options = {
    from: sent_from,
    to: send_to,
    subject: subject,
    html: customizedMessage,
    headers: {
      'X-Mailer': 'Rubertogo Mailer',
      'X-Domain': 'rubertogo.com',
      'Precedence': 'bulk',
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'High',
      'List-Unsubscribe': '<mailto:unsubscribe@rubertogo.com>',
    },
    attachments: attachment ? [attachment] : [],  
  };

  try {
    const info = await transporter.sendMail(options);
    console.log('Email sent:', info.response);
  } catch (err) {
    console.error('Error sending email:', err);
  }
};

module.exports = sendEmail;
