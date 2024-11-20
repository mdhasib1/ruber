const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PreAuthorization = require('../Models/PreAuthorization.Schema');
const Booking = require('../Models/Booking.Schema');
const { createContractPDF } = require('../helpers/pdfGenerator');
const {
  createNotification,
  fetchNotifications,
} = require("../helpers/notificationHelper");

const createPreAuthorization = async (req, res) => {
  console.log('Creating pre-authorization...');
  const { sessionId, bookingId } = req.body;
  const { phone } = req.user;

  try {
    // Use a mutex lock to prevent concurrent execution
    const lockKey = `preAuthLock:${bookingId}`;
    const lockAcquired = await acquireLock(lockKey);
    if (!lockAcquired) {
      return res.status(429).json({ error: "Another request is processing this booking. Please try again later." });
    }

    try {
      // Retrieve Stripe session details
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const customerId = session.customer;
      const paymentIntentId = session.payment_intent;
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const paymentMethodId = paymentIntent.payment_method;

      if (!paymentMethodId) {
        throw new Error("No reusable payment method found.");
      }

      // Fetch booking
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error("Booking not found.");
      }

      // Upsert pre-authorization and prevent duplicates
    

      // Create Stripe pre-authorization payment intent
      const preAuthIntent = await stripe.paymentIntents.create({
        amount: 300 * 100,
        currency: "chf",
        customer: customerId,
        payment_method: paymentMethodId,
        capture_method: "manual",
        confirm: true,
        return_url: `${req.headers.origin}/auth-complete`,
        metadata: { purpose: "Pre-authorization hold" },
      });

      console.log("Pre-authorization created successfully:", preAuthIntent.id);

      const preAuthorization = await PreAuthorization.findOneAndUpdate(
        { bookingId, status: 'Pending' },
        {
          $setOnInsert: {
            userId: req.user._id,
            bookingId: booking._id,
            phone: phone,
            authorizedAmount: 300,
            holdDurationDays: 7,
            preAuthPaymentIntentId: preAuthIntent.id,
            status: 'Pending',
            stripecreated: false,
            emailSent: false,
            preAuthorization: true,
          },
        },
        { new: true, upsert: true }
      );

      // If already processed, return immediately
      if (preAuthorization.stripecreated && preAuthorization.emailSent) {
        console.log('Pre-authorization already exists for this booking:', preAuthorization._id);
        booking.status = 'accepted';
        await booking.save();
        return res.status(200).json({
          message: "A pre-authorization already exists for this booking.",
        });
      }

      // Update pre-authorization and booking status
      preAuthorization.stripecreated = true;
      preAuthorization.emailSent = true;
      booking.status = 'accepted';

      await preAuthorization.save();
      await booking.save();

      // Generate contract PDF and send email
      await createContractPDF(booking._id);

      res.status(201).json({
        message: "Pre-authorization created successfully",
        preAuthPaymentIntentId: preAuthIntent.id,
      });
    } finally {
      // Release the lock
      await releaseLock(lockKey);
    }
  } catch (error) {
    console.error("Failed to create pre-authorization:", error.message);
    res.status(500).json({
      error: error.message.includes("PaymentMethod")
        ? "Payment method cannot be reused. Please use a new payment method."
        : "Failed to create pre-authorization. Please try again.",
    });
  }
};


const locks = {}; 

const acquireLock = async (key) => {
  if (locks[key]) return false;
  locks[key] = true;
  return true;
};

const releaseLock = async (key) => {
  delete locks[key];
};


  

const capturePreAuthorization = async (req, res) => {
  console.log(req.body)
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }

    const preAuthorization = await PreAuthorization.findOne({
      bookingId: booking._id,
      status: "Pending",
      stripecreated: true,
    });


    console.log(preAuthorization)

    if (!preAuthorization || !preAuthorization.preAuthPaymentIntentId) {
      return res.status(404).json({
        error: "No valid pre-authorization found for this booking.",
      });
    }

    const capturedPaymentIntent = await stripe.paymentIntents.capture(
      preAuthorization.preAuthPaymentIntentId
    );

    console.log("Payment captured successfully:", capturedPaymentIntent);

    preAuthorization.status = "Captured";
    preAuthorization.capturedAmount = capturedPaymentIntent.amount / 100;
    await preAuthorization.save();


    res.status(200).json({
      message: "Payment captured successfully.",
      capturedAmount: capturedPaymentIntent.amount / 100,
    });
  } catch (error) {
    console.error("Failed to capture payment:", error.message);
    res.status(500).json({
      error: "Failed to capture the payment. Please try again.",
    });
  }
};


const cancelPreAuthorization = async (req, res) => {
  console.log(req.body)
  const { bookingId } = req.body;

  try {
    // Retrieve the booking and pre-authorization
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }

    console.log(booking)

    const preAuthorization = await PreAuthorization.findOne({
      bookingId: booking._id,
      status: "Pending",
      });

    console.log(preAuthorization)

    if (!preAuthorization || !preAuthorization.preAuthPaymentIntentId) {
      return res.status(404).json({
        error: "No valid pre-authorization found for this booking.",
      });
    }

    // Cancel the pre-authorization (release the hold)
    const cancellation = await stripe.paymentIntents.cancel(
      preAuthorization.preAuthPaymentIntentId,
      {
        cancellation_reason:"requested_by_customer",
      }
    );


    preAuthorization.status = "Canceled";
    await preAuthorization.save();


    res.status(200).json({
      message: "Pre-authorization successfully cancelled."
    });
  } catch (error) {
    console.log("Failed to cancel pre-authorization:", error);
    res.status(500).json({
      error: "Failed to cancel the pre-authorization. Please try again.",
    });
  }
};

const getAllPreAuthorizations = async (req, res) => {
  try {
    const preAuthorizations = await PreAuthorization.find()
      .populate({ path: "userId", select: "firstName lastName email phone" })
      .populate({ path: "bookingId", select: "vanId startDate endDate" })
      .lean();

    res.status(201).json(preAuthorizations);
  }
  catch (error) {
    console.error("Error fetching pre-authorizations:", error);
    res.status(500).json({
      error: "Failed to fetch pre-authorizations. Please try again.",
    });
  }
}



module.exports = {
  createPreAuthorization,
  capturePreAuthorization,
  cancelPreAuthorization,
  getAllPreAuthorizations,
};
