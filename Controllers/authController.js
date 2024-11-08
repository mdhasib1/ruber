const User = require("../Models/User.Schema");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/Email");

const generateOtp = () => {
  const otp = crypto.randomInt(1000, 9999).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000;
  return { otp, otpExpires };
};

const generateToken = (user, secret, expiresIn) => {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, secret, { expiresIn });
};

exports.register = async (req, res) => {
  const { firstName, lastName, email, phone, address, bio } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user)
      return res.status(400).json({ message: "Email already registered" });

    const { otp, otpExpires } = generateOtp();

    user = new User({
      firstName,
      lastName,
      email,
      phone,
      address,
      bio,
      otp,
      otpExpires,
    });

    await user.save();


    await sendEmail({
      subject: "Your OTP for Verification",
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
              .otp-code {
                display: inline-block;
                background-color: #ff6f61;
                color: #ffffff;
                font-size: 32px;
                font-weight: bold;
                padding: 10px 20px;
                border-radius: 5px;
                text-align: center;
                margin: 20px 0;
                letter-spacing: 4px;
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
                Rubertogo Verification
              </div>
              <div class="content">
                <p class="message">Hi there,</p>
                <p class="message">Thank you for using Rubertogo! Please enter the OTP code below to verify your account. This code is valid for <strong>10 minutes</strong>.</p>
                <div class="otp-code">${otp}</div>
                <p class="message">If you did not request this code, please disregard this email or contact our support team for assistance.</p>
              </div>
              <div class="footer">
                <p>Need help? <a href="mailto:support@rubertogo.com">Contact Support</a></p>
                <p>Rubertogo, Inc. | All rights reserved &copy; ${new Date().getFullYear()}</p>
              </div>
            </div>
          </body>
        </html>
      `,
      send_to: email,
      sent_from: "info@rubertogo.com",
    });

    res.status(200).json({ message: "OTP sent for verification" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Registration failed" });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified)
      return res.status(400).json({ message: "User already verified" });

    if (user.otp !== otp || Date.now() > user.otpExpires) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const accessToken = generateToken(user, process.env.ACCESS_TOKEN_SECRET, "15m");
    const refreshToken = generateToken(user, process.env.REFRESH_TOKEN_SECRET, "7d");
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "OTP verified successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "OTP verification failed" });
  }
};



exports.sendLoginOtp = async (req, res) => {
  console.log("sendLoginOtp", req.body);
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    console.log("user", user);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found or not verified" });
    }

    const { otp, otpExpires } = generateOtp();
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendEmail({
      subject: "Your OTP for Verification",
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
              .otp-code {
                display: inline-block;
                background-color: #ff6f61;
                color: #ffffff;
                font-size: 32px;
                font-weight: bold;
                padding: 10px 20px;
                border-radius: 5px;
                text-align: center;
                margin: 20px 0;
                letter-spacing: 4px;
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
                Rubertogo Verification
              </div>
              <div class="content">
                <p class="message">Hi there,</p>
                <p class="message">Thank you for using Rubertogo! Please enter the OTP code below to verify your account. This code is valid for <strong>10 minutes</strong>.</p>
                <div class="otp-code">${otp}</div>
                <p class="message">If you did not request this code, please disregard this email or contact our support team for assistance.</p>
              </div>
              <div class="footer">
                <p>Need help? <a href="mailto:support@rubertogo.com">Contact Support</a></p>
                <p>Rubertogo, Inc. | All rights reserved &copy; ${new Date().getFullYear()}</p>
              </div>
            </div>
          </body>
        </html>
      `,
      send_to: email,
      sent_from: "info@rubertogo.com",
    });
    
    

    res.status(201).json({ message: "OTP sent for login" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

exports.existAccount = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(201).json({message:" please login your account"});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to check user" });
  }
};

exports.userProfile = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(201).json({ user });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to check user" });
  }
}


exports.updateProfile = async (req, res) => {
  const { email, firstName, lastName, phone, address, bio } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    user.firstName = firstName;
    user.lastName = lastName;
    user.phone = phone;
    user.address = address;
    user.licenseFront = licenseFront;
    user.licenseBack = licenseBack;
    user.idDocumentFront = idDocumentFront;
    user.idDocumentBack = idDocumentBack;
  

    await user.save();

    res.status(201).json({ message: "Profile updated successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update profile" });
  }
}


exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateToken(user, process.env.ACCESS_TOKEN_SECRET, "15m");

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};



exports.logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) return res.status(204).json({ message: "No content" }); 

  try {
    const user = await User.findOne({ refreshToken });

    if (!user) {
      res.clearCookie("accessToken", { httpOnly: true, secure: process.env.NODE_ENV === "production" });
      res.clearCookie("refreshToken", { httpOnly: true, secure: process.env.NODE_ENV === "production" });
      return res.status(204).json({ message: "User not found" });
    }

    user.refreshToken = null;
    await user.save();

    res.clearCookie("accessToken", { httpOnly: true, secure: process.env.NODE_ENV === "production" });
    res.clearCookie("refreshToken", { httpOnly: true, secure: process.env.NODE_ENV === "production" });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
};
