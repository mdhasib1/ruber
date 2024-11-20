const Partner = require('../Models/Partner.Schema');
const sendEmail = require("../utils/Email");


exports.createPartner = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, interest, recommendations } = req.body;

    const existingPartner = await Partner.findOne({ email });
    if (existingPartner) {
      return res.status(400).json({ message: 'You have already Submit a request' });
    }

    const partner = new Partner({
      firstName,
      lastName,
      email,
      phone,
      interest,
      recommendations,
    });

    await partner.save();

    // Send a thank-you email to the partner
    await sendEmail({
      subject: "Thank You for Your Partnership Application",
      customizedMessage: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f7f9fc;
                color: #333;
                margin: 0;
                padding: 0;
              }
              .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                overflow: hidden;
              }
              .header {
                background-color: #ff6f61;
                color: #ffffff;
                text-align: center;
                padding: 20px;
                font-size: 24px;
                font-weight: bold;
              }
              .content {
                padding: 20px 30px;
              }
              .message {
                font-size: 16px;
                color: #555;
                line-height: 1.6;
              }
              .cta {
                display: inline-block;
                margin-top: 20px;
                padding: 10px 20px;
                background-color: #ff6f61;
                color: #ffffff;
                font-weight: bold;
                font-size: 16px;
                border-radius: 5px;
                text-decoration: none;
                transition: background-color 0.3s;
              }
              .cta:hover {
                background-color: #e85c50;
              }
              .footer {
                text-align: center;
                font-size: 12px;
                color: #aaa;
                padding: 20px;
                background-color: #f1f1f1;
              }
              .footer a {
                color: #ff6f61;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                Thank You for Joining Rubertogo!
              </div>
              <div class="content">
                <p class="message">Dear ${firstName} ${lastName},</p>
                <p class="message">Thank you for submitting your partnership application! We’re thrilled to see your interest in partnering with us. Our team will review your application and get back to you shortly.</p>
                <p class="message">If you have any questions or need immediate assistance, feel free to <a href="mailto:support@rubertogo.com" style="color: #ff6f61; text-decoration: none;">contact us</a>.</p>
                <a href="https://rubertogo.com" class="cta">Visit Our Website</a>
              </div>
              <div class="footer">
                <p>Rubertogo, Inc. | All rights reserved &copy; ${new Date().getFullYear()}</p>
              </div>
            </div>
          </body>
        </html>
      `,
      send_to: email,
      sent_from: "info@rubertogo.com",
    });

    res.status(201).json({ message: 'Application submitted successfully.', data: partner });
  } catch (error) {
    console.error('Error creating partner application:', error);
    res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};


// Get all partner applications
exports.getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find().sort({ createdAt: -1 });
    res.status(200).json({ data: partners });
  } catch (error) {
    console.error('Error fetching partner applications:', error);
    res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

// Delete a partner application by ID
exports.deletePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPartner = await Partner.findByIdAndDelete(id);

    if (!deletedPartner) {
      return res.status(404).json({ message: 'Partner application not found.' });
    }

    res.status(200).json({ message: 'Application deleted successfully.' });
  } catch (error) {
    console.error('Error deleting partner application:', error);
    res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};
