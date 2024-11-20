// controllers/webhookController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../Models/Booking.Schema');

const handlePaymentCompletion = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Payment completion webhook signature verification failed: ${err.message}`);
    return res.sendStatus(400);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      const booking = await Booking.findOneAndUpdate(
        { paymentIntentId: session.payment_intent },
        { status: 'Paid' },
        { new: true }
      );

      if (booking) {
        console.log('Booking status updated to Paid:', booking.id);
      } else {
        console.error('Booking not found for paymentIntentId:', session.payment_intent);
      }
    } catch (error) {
      console.error('Error updating booking status:', error.message);
    }
  }

  res.json({ received: true });
};


const handlePreAuthorizationCapture = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Pre-authorization webhook signature verification failed: ${err.message}`);
    return res.sendStatus(400);
  }

  if (event.type === 'payment_intent.requires_capture') {
    const paymentIntent = event.data.object;

    try {
      const capturedIntent = await stripe.paymentIntents.capture(paymentIntent.id);
      console.log('Pre-authorization captured:', capturedIntent.id);

      await Booking.findOneAndUpdate(
        { preAuthPaymentIntentId: paymentIntent.id },
        { preAuthStatus: 'Captured' },
        { new: true }
      );
    } catch (error) {
      console.error('Failed to capture pre-authorization:', error.message);
    }
  }

  res.json({ received: true });
};

module.exports = { handlePaymentCompletion, handlePreAuthorizationCapture };
