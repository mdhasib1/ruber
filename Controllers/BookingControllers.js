const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Booking = require("../Models/Booking.Schema.js");
const Van = require("../Models/Van.Schema.js");
const User = require("../Models/User.Schema.js");
const Driver = require("../Models/Driver.Schema.js");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/Email");
const cron = require("node-cron");
const moment = require("moment-timezone");
const {
  createNotification,
  fetchNotifications,
} = require("../helpers/notificationHelper");

const generateOtp = () => {
  const otp = crypto.randomInt(1000, 9999).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000;
  return { otp, otpExpires };
};

const createBooking = async (req, res, io) => {
  const {
    vanId,
    selectedSlots,
    totalPrice,
    firstName,
    lastName,
    address,
    email,
    phone,
    timeZone,
    idDocumentFront,
    idDocumentBack,
    LicenseFront,
    LicenseBack,
    isNotDriver,
    packageId,
  } = req.body;

  let driverInfo = {};
  if (isNotDriver && typeof req.body.driverInfo === "string") {
    try {
      driverInfo = JSON.parse(req.body.driverInfo);
    } catch (error) {
      console.error("Error parsing driverInfo:", error);
      return res.status(400).json({ error: "Invalid driverInfo format." });
    }
  }

  const formattedSlots = selectedSlots.map((slot) => {
    const [day, month, year] = slot.date.split("/");
    const localTime = moment.tz(
       `${year}-${month}-${day} ${slot.time}:00`,
       timeZone
    );
    return {
       date: localTime.format("DD-MM-YYYY"),
       time: localTime.format("HH:mm"),
    };
 });

 const startSlot = formattedSlots[0];
 const endSlot = formattedSlots[formattedSlots.length - 1];

 const startTime = moment.tz(
   `${startSlot.date.split("-").reverse().join("-")} ${startSlot.time}:00`,
   timeZone
 ).utcOffset(0, true).toISOString();

 const endTime = moment.tz(
   `${endSlot.date.split("-").reverse().join("-")} ${endSlot.time.split(":")[0]}:59:59`,
   timeZone
 ).utcOffset(0, true).toISOString();

 try {
    const conflictingBookings = await Booking.find({
       vanId,
       $or: [
          {
             startTime: { $lt: endTime },
             endTime: { $gt: startTime },
          },
       ],
    });

    if (conflictingBookings.length > 0) {
       return res.status(400).json({
          error:
             "The hours you selected are already booked. Please select different hours and try again.",
       });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        firstName,
        lastName,
        email,
        phone,
        address,
        idDocumentFront,
        idDocumentBack,
        timeZone,
        licenseFront: LicenseFront,
        licenseBack: LicenseBack,
      });
      const { otp, otpExpires } = generateOtp();
      user.otp = otp;
      user.otpExpires = otpExpires;
      const saveUser = await user.save();
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
        send_to: saveUser.email,
        sent_from: "info@rubertogo.com",
      });
    } else {
      user.firstName = firstName;
      user.lastName = lastName;
      user.phone = phone;
      user.address = address || user.address;
      user.idDocumentFront = idDocumentFront || user.idDocumentFront;
      user.idDocumentBack = idDocumentBack || user.idDocumentBack;
      user.licenseFront = LicenseFront || user.licenseFront;
      user.licenseBack = LicenseBack || user.licenseBack;
      user.timeZone = timeZone || user.timeZone;
      const { otp, otpExpires } = generateOtp();
      user.otp = otp;
      user.otpExpires = otpExpires;
      const updateUser = await user.save();

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
        send_to: updateUser.email,
        sent_from: "info@rubertogo.com",
      });
    }

    let driver = null;
    if (isNotDriver && driverInfo) {
      driver = await Driver.findOne({ email: driverInfo.driverEmail });
      if (!driver) {
        driver = new Driver({
          userId: user._id,
          firstName: driverInfo.driverFirstName,
          lastName: driverInfo.driverLastName,
          email: driverInfo.driverEmail,
          phone: driverInfo.driverPhone,
          driverAddress: driverInfo.driverAddress,
          licenseFront: driverInfo.driverLicenseFront,
          licenseBack: driverInfo.driverLicenseBack,
          idDocumentFront: driverInfo.driverIdDocumentFront,
          idDocumentBack: driverInfo.driverIdDocumentBack,
        });
        await driver.save();
      }
    }

   
  
    const booking = new Booking({
      userId: user._id,
      vanId,
      selectedSlots: formattedSlots,
      startDate: startSlot.date,
      endDate: endSlot.date,
      startTime: startTime,
      endTime: endTime,
      timeZone: timeZone,
      totalPrice,
      packageId: packageId || null,
    });

    const savebooking = await booking.save();

    const van = await Van.findById(vanId);
    if (!van) {
      return res.status(404).json({ error: "Van not found" });
    }

    const vanImage = van.images[0];
    const vanName = van.name.en || van.name;

    const customer = await stripe.customers.create({
      email,
      name: `${firstName} ${lastName}`,
      address: { line1: address },
      phone,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: customer.id,
      line_items: [
        {
          price_data: {
            currency: "chf",
            product_data: { name: vanName, images:[vanImage] },
            unit_amount: totalPrice * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        setup_future_usage: "on_session",
      },
      phone_number_collection: {
        enabled: true,
      },
      success_url: `${req.headers.origin}/:lang/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${savebooking._id}`,
      cancel_url: `${req.headers.origin}/cancel`,
    });


    const bookingHours = selectedSlots.length;

    const adminUsers = await User.find({ role: "admin" });

    for (const admin of adminUsers) {
      const notificationData = {
        title: "New Booking Created",
        message: `A new booking has been created for van ${vanImage} ${vanName}. Booked for ${bookingHours} hours by ${firstName} ${lastName}.`,
        userId: admin._id,
      };

      const notification = await createNotification(io, notificationData);
       await fetchNotifications(admin._id);

      io.to(admin._id.toString()).emit("newBookingNotification", {
        vanId,
        message: `New booking created for van ${vanId}.`,
        booking,
        notification,
      });
    }

    res.status(200).json({
      message: "OTP sent to email. Please verify to proceed with booking.",
      userId: user._id,
      email: user.email,
      sessionId: session.id,
      bookingId: savebooking._id,
    });
  } catch (error) {
    console.log("Error in createBooking:", error);
    res.status(500).json({ error: "Failed to create booking request." });
  }
};

const getCurrentBooking = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userTimeZone = user.timeZone;
    const nowAsDate = moment().tz(userTimeZone).toDate(); 


    const upcomingBookings = await Booking.find({
      userId,
      status: "accepted",
      startTime: { $gte: nowAsDate }, 
    })
      .sort({ startTime: 1 }) 
      .populate("vanId", "name images pricePerHour location plateNumber");



    let currentBooking = null;
    let upcomingBooking = [];

    if (upcomingBookings.length > 0) {
      currentBooking = upcomingBookings.find(
        (booking) =>
          new Date(booking.startTime) <= nowAsDate && nowAsDate < new Date(booking.endTime)
      );

      if (currentBooking) {
        upcomingBooking = upcomingBookings.filter(
          (booking) => booking._id.toString() !== currentBooking._id.toString()
        );
      } else {
      
        currentBooking = upcomingBookings[0];
        upcomingBooking = upcomingBookings.slice(1);
      }
    }

    const response = {
      currentBooking: currentBooking
        ? {
            ...currentBooking.toObject(),
            startTime: currentBooking.startTime.toISOString(),
            endTime: currentBooking.endTime.toISOString(),
          }
        : null,
      upcomingBooking: upcomingBooking.map((booking) => ({
        ...booking.toObject(),
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
      })),
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching current booking:", error.message);
    res.status(500).json({
      error: "Failed to fetch current and upcoming bookings. Please try again later.",
    });
  }
};


const getBookingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingHistory = await Booking.find({
      userId,
      status: { $in: ["completed", "canceled"] },
    })
      .populate("vanId", "name images")
      .sort({ startTime: -1 });

    res.json(bookingHistory);
  } catch (error) {
    console.error("Error fetching booking history:", error);
    res.status(500).json({ error: "Failed to fetch booking history" });
  }
};

const requestBookingExtension = async (req, res) => {
  const { bookingId, newEndDate, newEndTime, additionalSlots } = req.body;
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const vanAvailability = await Booking.findOne({
      vanId: booking.vanId,
      startDate: { $lte: newEndDate },
      endDate: { $gte: booking.endDate },
      startTime: { $lt: newEndTime },
      endTime: { $gt: booking.endTime },
      _id: { $ne: booking._id },
    });

    if (vanAvailability) {
      booking.extensionStatus = "pending";
      booking.extensionRequested = {
        startDate: booking.endDate,
        endDate: newEndDate,
        startTime: booking.endTime,
        endTime: newEndTime,
        selectedSlots: additionalSlots,
      };
    } else {
      booking.extensionStatus = "approved";
      booking.endDate = newEndDate;
      booking.endTime = newEndTime;
      booking.selectedSlots.push(...additionalSlots);
    }

    await booking.save();
    res.json(booking);
  } catch (error) {
    console.error("Error requesting extension:", error);
    res.status(500).json({ error: "Failed to request booking extension" });
  }
};

const confirmExtension = async (req, res) => {
  const { action } = req.body;
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (action === "approve") {
      booking.extensionStatus = "approved";
      booking.startDate = booking.extensionRequested.startDate;
      booking.endDate = booking.extensionRequested.endDate;
      booking.startTime = booking.extensionRequested.startTime;
      booking.endTime = booking.extensionRequested.endTime;
    } else {
      booking.extensionStatus = "rejected";
      booking.extensionRequested = null;
    }

    await booking.save();
    res.json(booking);
  } catch (error) {
    console.error("Error confirming extension:", error);
    res.status(500).json({ error: "Failed to confirm extension" });
  }
};


cron.schedule("* * * * *", async () => {
  try {
    const bookings = await Booking.find({
      status: { $in: ["pending", "accepted", "completed"] },
    }).populate("userId vanId");

    const adminUsers = await User.find({ role: "admin" });

    for (const booking of bookings) {
      const user = booking.userId;
      const van = booking.vanId;

      if (!user || !van) continue;

      const userTimeZone = user.timeZone;

      if (!userTimeZone) {
        console.error("User timezone not found.");
        continue;
      }

      const now = new Date();
      const offsetInMinutes = moment.tz(now, userTimeZone).utcOffset();
      const nowUTC = new Date(now.getTime() + offsetInMinutes * 60 * 1000);

      const createdAt = new Date(booking.createdAt);
      const startTime = new Date(booking.startTime);
      const endTime = new Date(booking.endTime);

      if (
        booking.status === "pending" &&
        now - createdAt > 30 * 60 * 1000 &&
        !booking.canceledReminderSent
      ) {
        booking.status = "canceled";
        booking.canceledReminderSent = true;
        await booking.save();

        await notifyCustomer(user, "Booking Canceled", `Hi ${user.firstName}, your booking for ${van.name.en} has been canceled as it was not confirmed within 30 minutes.`);

        await sendEmail({
          subject: "Booking Canceled",
          send_to: user.email,
          customizedMessage: createEmailTemplate(
            "Booking Canceled",
            `Hi ${user.firstName}, your booking for ${van.name.en} has been canceled as it was not confirmed within 30 minutes.`
          ),
          sent_from: "info@rubertogo.com",
        });

        for (const admin of adminUsers) {
          await notifyAdmin(admin, "Booking Canceled", `Booking for van ${van.name.en} was canceled.`, booking);
          await sendEmail({
            subject: "Booking Canceled",
            send_to: admin.email,
            customizedMessage: createEmailTemplate(
              "Booking Canceled",
              `The booking for ${van.name.en} by ${user.firstName} ${user.lastName} has been canceled. It was not confirmed within the required time frame.`
            ),
            sent_from: "info@rubertogo.com",
          });
        }
        continue;
      }

      if (
        booking.status === "accepted" &&
        nowUTC >= new Date(startTime - 30 * 60 * 1000) &&
        nowUTC < startTime &&
        !booking.reminderSent
      ) {
        booking.reminderSent = true;
        await booking.save();

        await notifyCustomer(user, "Upcoming Booking", `Hi ${user.firstName}, your booking for ${van.name.en} starts in 30 minutes.`);

        await sendEmail({
          subject: "Upcoming Booking",
          send_to: user.email,
          customizedMessage: createEmailTemplate(
            "Upcoming Booking",
            `Hi ${user.firstName}, your booking for ${van.name.en} starts in 30 minutes.`
          ),
          sent_from: "info@rubertogo.com",
        });

        for (const admin of adminUsers) {
          await notifyAdmin(admin, "Upcoming Booking", `Booking for ${van.name.en} by ${user.firstName} starts in 30 minutes.`, booking);

          await sendEmail({
            subject: "Upcoming Booking",
            send_to: admin.email,
            customizedMessage: createEmailTemplate(
              "Upcoming Booking",
              `A booking for ${van.name.en} by ${user.firstName} ${user.lastName} is scheduled to start in 30 minutes. Please ensure everything is ready.`
            ),           
            sent_from: "info@rubertogo.com",
          });
        }
        continue;
      }

      if (
        booking.status === "accepted" &&
        nowUTC >= startTime &&
        nowUTC < endTime &&
        !booking.startingReminderSent
      ) {
        booking.startingReminderSent = true;
        await booking.save();

        await notifyCustomer(user, "Booking Started", `Hi ${user.firstName}, your booking for ${van.name.en} has started.`);

        await sendEmail({
          subject: "Booking Started",
          send_to: user.email,
          customizedMessage: createEmailTemplate(
            "Booking Started",
            `Hi ${user.firstName}, your booking for ${van.name.en} has started. Enjoy your ride!`
          ),          
          sent_from: "info@rubertogo.com",
        });
        continue;
      }

      if (booking.status === "accepted" && nowUTC >= endTime && !booking.endingReminderSent) {
        booking.status = "completed";
        booking.endingReminderSent = true;
        await booking.save();

        await notifyCustomer(user, "Booking Completed", `Hi ${user.firstName}, your booking for ${van.name.en} has been completed. Thank you for using our service!`);


        await sendEmail({
          subject: "Booking Completed",
          send_to: user.email,
          customizedMessage: createEmailTemplate(
            "Booking Completed",
            `Hi ${user.firstName}, your booking for ${van.name.en} has been completed. Thank you for using our service!`
          ),
          sent_from: "info@rubertogo.com",
        });

        for (const admin of adminUsers) {
          await notifyAdmin(admin, "Booking Completed", `Booking for ${van.name.en} has been completed.`, booking);
          await sendEmail({
            subject: "Booking Completed",
            send_to: admin.email,
            customizedMessage: createEmailTemplate(
              "Booking Completed",
              `The booking for ${van.name.en} by ${user.firstName} ${user.lastName} has been completed. Thank you for overseeing this booking.`
            ),
            sent_from: "info@rubertogo.com",
          });
        }
      }
    }
  } catch (error) {
    console.error("Error in scheduled notifications:", error);
  }
});



async function notifyAdmin(admin, title, message, booking) {
  try {
    const notification = await createNotification(global.io, {
      title,
      message,
      userId: admin._id,
    });
    await fetchNotifications(admin._id);
    global.io.to(admin._id.toString()).emit("newBookingNotification", {
      message,
      booking,
      notification,
    });
  } catch (error) {
    console.error(`Error creating admin notification for ${title}:`, error);
  }
}

async function notifyCustomer(user, title, message) {
  try {
    const notification = await createNotification(global.io, {
      title,
      message,
      userId: user._id,
    });
    await fetchNotifications(user._id);
    global.io.to(user._id.toString()).emit("newCustomerNotification", {
      message,
      notification,
    });
  } catch (error) {
    console.error(`Error creating customer notification for ${title}:`, error);
  }
}

const createEmailTemplate = (title, bodyMessage) => `
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
        <div class="header">${title}</div>
        <div class="content">
          <p class="message">${bodyMessage}</p>
        </div>
        <div class="footer">
          <p>Rubertogo, Inc. | All rights reserved &copy; ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
  </html>
`;



const switchVan = async (req, res) => {
  const { alternateVanId } = req.body;
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    booking.vanId = alternateVanId;
    booking.extensionStatus = "approved";
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const currentTime = moment();
    const bookingStartTime = moment(booking.startTime);

    const timeDifference = bookingStartTime.diff(currentTime, "hours");

    if (timeDifference < 24) {
      return res.status(400).json({
        message:
          "Cancellation can only be made at least 24 hours before the booking start time.",
      });
    }

    booking.status = "Cancelled";
    await booking.save();

    res.status(200).json({ message: "Booking successfully cancelled" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "An error occurred while processing your cancellation",
    });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    res.json(booking);
  } catch (error) {
    console.error("Error fetching booking by ID:", error);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
};

const getPendingBookings = async (req, res, io) => {
  try {
    const userId = req.user.id;

    const pendingBookings = await Booking.find({
      userId,
      status: "pending",
    })
      .populate("vanId", "name images pricePerHour")
      .sort({ startTime: 1 });

    if (pendingBookings.length === 0) {
      return res.status(404).json({ message: "No pending bookings found." });
    }

    res.json(pendingBookings);
  } catch (error) {
    console.error("Error fetching pending bookings:", error);
    res.status(500).json({ error: "Failed to fetch pending bookings" });
  }
};

const completePendingPayment = async (req, res, io) => {
  const { bookingId } = req.body;
  try {
    const booking = await Booking.findById(bookingId);
    const user = await User.findById(booking.userId);

    if (!booking || booking.status !== "pending") {
      return res.status(404).json({ error: "Pending booking not found." });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      address: { line1: user.address },
      phone: user.phone,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: customer.id,
      line_items: [
        {
          price_data: {
            currency: "chf",
            product_data: {
              name: `Booking for ${booking.vanId.name}`,
            },
            unit_amount: booking.totalPrice * 100,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        setup_future_usage: "on_session",
      },
      phone_number_collection: {
        enabled: true,
      },
      mode: "payment",
      success_url: `${req.headers.origin}/:lang/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error("Error completing pending payment:", error);
    res.status(500).json({ error: "Failed to complete payment" });
  }
};

const getBookingMonitoringData = async (req, res) => {
  try {
    const vans = await Van.find().lean();
    const bookings = await Booking.find({ status: { $in: ["pending", "accepted"] } })
      .populate("vanId", "name")
      .populate("userId", "firstName lastName email timeZone")
      .lean();

    const monitoringData = vans.map((van) => {
      const vanBookings = bookings.filter((b) => b.vanId._id.toString() === van._id.toString());
      const hourlySlots = Array.from({ length: 24 }, (_, hour) => {
        return vanBookings.filter((b) =>
          b.selectedSlots.some((slot) => {
            const slotHour = parseInt(slot.time.split(":")[0], 10);
            return slotHour === hour;
          })
        );
      });

      return {
        van,
        hourlySlots,
      };
    });

    res.status(200).json(monitoringData);
  } catch (error) {
    console.error("Error fetching booking monitoring data:", error);
    res.status(500).json({ error: "Failed to fetch booking monitoring data." });
  }
};

module.exports = {
  createBooking,
  switchVan,
  getCurrentBooking,
  getBookingHistory,
  requestBookingExtension,
  confirmExtension,
  cancelBooking,
  getBookingById,
  getPendingBookings,
  completePendingPayment,
  getBookingMonitoringData,
};
