const Partner = require('../Models/Partners.Schema')
const User = require('../Models/User.Schema')
const crypto = require("crypto");
const sendEmail = require("../utils/Email");
const jwt = require("jsonwebtoken");
const Booking = require('../Models/Booking.Schema');
const Van = require('../Models/Van.Schema.js');
const PreAuthorization = require('../Models/PreAuthorization.Schema');
const Package = require('../Models/Package');
const Review = require('../Models/Reviews.Schema');


const generateOtp = () => {
    const otp = crypto.randomInt(1000, 9999).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;
    return { otp, otpExpires };
  };
  
exports.createPartner = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            phone,
            email,
            companyName,
            companyLegalAddress,
            companyOfficeAddress,
            timeZone,
            vatNumber
        } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already registered' });
        }

        const { otp, otpExpires } = generateOtp();

        const referralCode = crypto.randomBytes(3).toString("hex").toUpperCase();
        

        const newUser = new User({
            firstName,
            lastName,
            phone,
            email,
            address: companyLegalAddress,
            referralCode,
            timeZone,
            otp,
            otpExpires,
            role: 'partner'
        });

        const savedUser = await newUser.save();

        const newPartner = new Partner({
            user: savedUser._id,
            companyName,
            companyLegalAddress,
            companyOfficeAddress,
            vat:vatNumber
        });

        const savedPartner = await newPartner.save();

        await sendEmail({
            subject: "Your Partner OTP for Verification",
            customizedMessage: `
              <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      background-color: #f9fafc;
                      color: #333;
                      margin: 0;
                      padding: 0;
                    }
                    .container {
                      max-width: 600px;
                      margin: 20px auto;
                      background-color: #ffffff;
                      border-radius: 8px;
                      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                      overflow: hidden;
                    }
                    .header {
                      background-color: #4caf50;
                      color: #ffffff;
                      text-align: center;
                      padding: 20px;
                      font-size: 24px;
                      font-weight: bold;
                    }
                    .content {
                      padding: 20px 30px;
                      line-height: 1.6;
                    }
                    .otp-code {
                      display: inline-block;
                      background-color: #4caf50;
                      color: #ffffff;
                      font-size: 28px;
                      font-weight: bold;
                      padding: 10px 20px;
                      border-radius: 5px;
                      margin: 20px 0;
                      text-align: center;
                    }
                    .cta {
                      display: inline-block;
                      background-color: #4caf50;
                      color: #ffffff;
                      text-decoration: none;
                      padding: 12px 20px;
                      border-radius: 5px;
                      font-size: 16px;
                      margin-top: 20px;
                      transition: background-color 0.3s;
                    }
                    .cta:hover {
                      background-color: #43a047;
                    }
                    .footer {
                      text-align: center;
                      padding: 15px;
                      font-size: 12px;
                      color: #777;
                      background-color: #f1f1f1;
                    }
                    .footer a {
                      color: #4caf50;
                      text-decoration: none;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      Partner Verification
                    </div>
                    <div class="content">
                      <p>Dear Partner,</p>
                      <p>We are excited to welcome you to Rubertogo! Use the OTP below to verify your account. This code is valid for <strong>10 minutes</strong>.</p>
                      <div class="otp-code">${otp}</div>
                      <p>If you didn’t request this OTP, please ignore this email or contact our support team for assistance.</p>
                      <a href="mailto:support@rubertogo.com" class="cta">Contact Support</a>
                    </div>
                    <div class="footer">
                      <p>&copy; ${new Date().getFullYear()} Rubertogo. All Rights Reserved.</p>
                      <p>Questions? <a href="mailto:support@rubertogo.com">Email Support</a></p>
                    </div>
                  </div>
                </body>
              </html>
            `,
            send_to: email,
            sent_from: "info@rubertogo.com",
          });
          
        res.status(201).json({
            message: 'Partner registered successfully',
            user: savedUser,
            partner: savedPartner
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.getAllPartners = async (req, res) => {
    try {
        const partners = await Partner.find().populate('user', 'firstName lastName email phone');
        res.status(200).json(partners);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.getPartnerById = async (req, res) => {
    try {
        const partner = await Partner.findById(req.params.id).populate('user', 'firstName lastName email phone');
        if (!partner) {
            return res.status(404).json({ message: 'Partner not found' });
        }
        res.status(200).json(partner);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.approvePartner = async (req, res) => {
    try {
        const partner = await Partner.findById(req.params.id);
        if (!partner) {
            return res.status(404).json({ message: 'Partner not found' });
        }

        partner.approvalStatus = 'approved';
        partner.approvedAt = new Date();
        await partner.save();

        res.status(200).json({ message: 'Partner application approved', partner });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.rejectPartner = async (req, res) => {
    try {
        const { comments } = req.body;
        const partner = await Partner.findById(req.params.id);
        if (!partner) {
            return res.status(404).json({ message: 'Partner not found' });
        }

        partner.approvalStatus = 'rejected';
        partner.rejectedAt = new Date();
        partner.comments = comments;
        await partner.save();

        res.status(200).json({ message: 'Partner application rejected', partner });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.getPartnerDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const partnerId = req.user.id; 
    const today = new Date();

    const calculateTimeRange = () => {
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      switch (type) {
        case "today":
          return { start: startOfDay, end: endOfDay };
        case "week": {
          const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          return { start: startOfWeek, end: endOfWeek };
        }
        case "month":
          return {
            start: new Date(today.getFullYear(), today.getMonth(), 1),
            end: new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59),
          };
        case "year":
          return {
            start: new Date(today.getFullYear(), 0, 1),
            end: new Date(today.getFullYear(), 11, 31, 23, 59, 59),
          };
        default:
          if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            return { start, end };
          }
          return { start: new Date(0), end: new Date() };
      }
    };

    const { start, end } = calculateTimeRange();

    const vans = await Van.find({ userId: partnerId });
    const vanIds = vans.map((van) => van._id);

    const allBookings = await Booking.find({ vanId: { $in: vanIds } });
    const todayBookings = allBookings.filter(
      (booking) => booking.createdAt >= start && booking.createdAt <= end
    );

    const totalRevenue = allBookings
      .filter((booking) => booking.status === "completed")
      .reduce((sum, booking) => sum + booking.totalPrice, 0);

    const totalBookings = allBookings.length;
    const todayBookingCount = todayBookings.length;
    const thisMonthBookings = allBookings.filter((booking) =>
      booking.createdAt >= new Date(today.getFullYear(), today.getMonth(), 1)
    ).length;

    const pendingBookings = allBookings.filter((booking) => booking.status === "pending").length;
    const completedBookings = allBookings.filter((booking) => booking.status === "completed").length;
    const canceledBookings = allBookings.filter((booking) => booking.status === "canceled").length;

    const availableVans = vans.length;

    // Fetch transaction history from the User collection
    const user = await User.findById(partnerId, "transactionHistory");
    const earningsHistory = user.transactionHistory || [];

    // Calculate Available Balance
    const availableBalance = earningsHistory.reduce((sum, transaction) => {
      if (transaction.type === "earning") return sum + transaction.amount;
      if (transaction.type === "spend" || transaction.type === "withdrawal") return sum - transaction.amount;
      return sum;
    }, 0);

    const stats = {
      totalBookings,
      todayBookingCount,
      thisMonthBookings,
      pendingBookings,
      completedBookings,
      canceledBookings,
      totalRevenue,
      availableVans,
      earningsHistory,
      availableBalance,
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching partner dashboard stats:", error);
    res.status(500).json({ message: "Error fetching partner dashboard stats" });
  }
};


