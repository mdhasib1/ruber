const BookingSettings = require('../Models/BookingSettings.Schema');
const { createNotification, fetchNotifications } = require('../helpers/notificationHelper');
const EarningsSettings = require('../Models/EarningsSettings.Schema');
const User = require('../Models/User.Schema');

exports.getBookingSettings = async (req, res, io, socketId) => {
    const { vanId } = req.params;
    try {
        const settings = await BookingSettings.findOne({ van: vanId }).populate('van');
        
        if (socketId && io) {
            io.to(socketId).emit('receiveBookingSettings', settings || {});
        }
        res.status(200).json(settings || {});
    } catch (error) {
        console.error("Error fetching booking settings:", error);
        res.status(500).json({ message: "Failed to fetch booking settings." });
    }
};

exports.updateBookingSettings = async (req, res, io) => {
    const { vanId } = req.params;
    const { freeHours, minimumPaidHours, freePeriodStart, blockedDateHours, bookingEnabled } = req.body;

    try {
        let settings = await BookingSettings.findOne({ van: vanId });

        if (!settings) {
            settings = new BookingSettings({
                van: vanId,
                freeHours,
                minimumPaidHours,
                freePeriodStart,
                blockedDateHours,
                bookingEnabled,
            });
        } else {
            settings.freeHours = freeHours ?? settings.freeHours;
            settings.minimumPaidHours = minimumPaidHours ?? settings.minimumPaidHours;
            settings.freePeriodStart = freePeriodStart || settings.freePeriodStart;
            settings.bookingEnabled = bookingEnabled ?? settings.bookingEnabled;

            blockedDateHours.forEach(({ date, hours }) => {
                const existingDateEntry = settings.blockedDateHours.find(
                    (entry) => entry.date.toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0]
                );

                if (existingDateEntry) {
                    existingDateEntry.hours = Array.from(new Set(hours));
                } else {
                    settings.blockedDateHours.push({ date, hours });
                }
            });
        }

        await settings.save();

        const adminUserId = req.user._id;

        const notificationData = {
            title: 'Booking Settings Updated',
            message: `Booking settings updated for van ${vanId}.`,
            userId: adminUserId,
        };

        const notification = await createNotification(io, notificationData);
        const notifications = await fetchNotifications(adminUserId);


      io.to(adminUserId.toString()).emit('bookingSettingsUpdated', {
            vanId,
            message: `Booking settings updated for van ${vanId}.`,
            settings,
            notification,
        });

        res.status(200).json({ message: "Booking settings updated successfully!", settings });
    } catch (error) {
        console.error("Error updating booking settings:", error);
        res.status(500).json({ message: "Failed to update booking settings." });
    }
};


exports.getEarningsSettings = async (req, res,io) => {
  try {
    const settings = await EarningsSettings.findOne();
    res.status(200).json({ settings });
  } catch (error) {
    console.error("Error fetching earnings settings:", error);
    res.status(500).json({ message: "Failed to fetch earnings settings." });
  }
};

exports.updateEarningsSettings = async (req, res,io) => {
  const { adminpercentage, partnerpercentage, referralpercentage, userpercentage } = req.body;
  try {
    let settings = await EarningsSettings.findOne();

    if (!settings) {
      settings = new EarningsSettings({
        adminpercentage,
        partnerpercentage,
        referralpercentage,
        userpercentage,
      });
    } else {
      settings.adminpercentage = adminpercentage ?? settings.adminpercentage;
      settings.partnerpercentage = partnerpercentage ?? settings.partnerpercentage;
      settings.referralpercentage = referralpercentage ?? settings.referralpercentage;
      settings.userpercentage = userpercentage ?? settings.userpercentage;
    }

    await settings.save();

    res.status(200).json({ message: "Earnings settings updated successfully!", settings });
  } catch (error) {
    console.error("Error updating earnings settings:", error);
    res.status(500).json({ message: "Failed to update earnings settings." });
  }
};

exports.ValidedreferralCode = async (req, res) => {
    const { referralCode } = req.body;
    try {
        const user = await User.findOne({referralCode});
        
        if(user){
            res.status(200).json({message: "Valid referral code"});
        }
        else{
            res.status(404).json({message: "Invalid referral code"});
        }
    }
    catch (error) {
        console.error("Error validating referral code:", error);
        res.status(500).json({ message: "Failed to validate referral code." });
    }
}
