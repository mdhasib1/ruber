const nodemailer = require("nodemailer");
const env = require('dotenv');

env.config();

const sendEmail = async ({ subject, customizedMessage, send_to, sent_from }) => {
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
  };

  try {
    const info = await transporter.sendMail(options);
    console.log('Email sent:', info.response);
  } catch (err) {
    console.error('Error sending email:', err);
  }
};

module.exports = sendEmail;


// 1. welcome email to new users
// 2. booking confirmation email
// 3. booking cancellation email
// 4. extended booking email
// 5. Admin email for new bookings
// 6. Admin email for booking cancellations
// 7. Admin email for extended bookings
// 8. Admin email for new user registrations
// 9. Admin email for partner engagement requests 
// 10. 1 hours before booking start email
// 11. 1 hours remaining email for extended bookings 
// 12.Review email after booking completion
// 13. Admin email for new reviews