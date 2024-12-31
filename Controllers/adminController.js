const User = require('../Models/User.Schema');
const Booking = require('../Models/Booking.Schema');
const Van = require('../Models/Van.Schema');
const PreAuthorization = require('../Models/PreAuthorization.Schema');
const Package = require('../Models/Package');
const Review = require('../Models/Reviews.Schema');


exports.getDashboardStats = async (req, res, io) => {
  try {
    const { startDate, endDate, type } = req.query;

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

    const threeMonthsAgo = new Date(today.setMonth(today.getMonth() - 3));
    const activeCustomers = await Booking.distinct("customerId", {
      createdAt: { $gte: threeMonthsAgo },
    });

    const totalActiveCustomers = activeCustomers.length;

    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const revenueTodayResult = await Booking.aggregate([
      { $match: { status: "completed", createdAt: { $gte: startOfDay, $lte: endOfDay } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const revenueToday = revenueTodayResult.length > 0 ? revenueTodayResult[0].total : 0;


    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    const revenueThisMonthResult = await Booking.aggregate([
      { $match: { status: "completed", createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const revenueThisMonth = revenueThisMonthResult.length > 0 ? revenueThisMonthResult[0].total : 0;

    const pendingBookings = await Booking.countDocuments({ status: "pending" });

    const refundedBookings = await Booking.countDocuments({ status: "refunded" });

    const daysInRange = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const dailyStats = await Booking.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$totalPrice", 0] } },
          accepted: { $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } },
          canceled: { $sum: { $cond: [{ $eq: ["$status", "canceled"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const filledDailyStats = Array.from({ length: daysInRange }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split("T")[0];
      const stat = dailyStats.find((d) => d._id === dateString);
      return {
        date: dateString,
        revenue: stat?.revenue || 0,
        accepted: stat?.accepted || 0,
        canceled: stat?.canceled || 0,
        pending: stat?.pending || 0,
      };
    });

    const totalRevenue = dailyStats.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalBookings = await Booking.countDocuments({ createdAt: { $gte: start, $lte: end } });
    const canceledBookings = await Booking.countDocuments({ status: "canceled", createdAt: { $gte: start, $lte: end } });
    const completedBookings = await Booking.countDocuments({ status: "completed", createdAt: { $gte: start, $lte: end } });
    const availableVans = await Van.countDocuments();
    const totalCustomers = await User.countDocuments({ role: "customer" });

    const stats = {
      todayBooked: await Booking.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      totalBookings,
      canceledBookings,
      completedBookings,
      availableVans,
      revenueToday,
      revenueThisMonth,
      pendingBookings,
      refundedBookings,
      totalCustomers,
      totalActiveCustomers,
      revenue: totalRevenue,
      averageBookingValue: totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : 0,
      dailyData: filledDailyStats,
    };

    io.emit("updateDashboardStats", stats);
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
};


exports.getAllBookings = async (req, res, io) => {
  try {
    const bookings = await Booking.find()
      .populate({
        path: "userId",
        select: "firstName lastName email phone address",
      })
      .populate({
        path: "vanId",
        select: "name description images plateNumber location",
      })
      .populate({
        path: "packageId",
        select: "name duration features",
      })
      .lean();

    const preAuthorizations = await PreAuthorization.find({
      bookingId: { $in: bookings.map((booking) => booking._id) },
    })
      .select("bookingId authorizedAmount preAuthPaymentIntentId status")
      .lean();

    const reviews = await Review.find({
      bookingId: { $in: bookings.map((booking) => booking._id) },
    })
      .select("bookingId rating comment createdAt")
      .lean();

    // Build maps for pre-authorizations and reviews by bookingId
    const preAuthorizationMap = preAuthorizations.reduce((acc, preAuth) => {
      if (preAuth.bookingId) {
        acc[preAuth.bookingId.toString()] = preAuth;
      }
      return acc;
    }, {});

    const reviewMap = reviews.reduce((acc, review) => {
      if (review.bookingId) {
        acc[review.bookingId.toString()] = review;
      }
      return acc;
    }, {});

    // Enrich bookings with pre-authorization and review data
    const enrichedBookings = bookings.map((booking) => ({
      ...booking,
      preAuthorization: preAuthorizationMap[booking._id?.toString()] || null,
      review: reviewMap[booking._id?.toString()] || null,
    }));

    res.status(200).json({
      success: true,
      message: "Fetched all bookings successfully.",
      data: enrichedBookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings.",
      error: error.message,
    });
  }
};


