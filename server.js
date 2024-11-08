const express = require('express');
const multer = require('multer');
const http = require('http');
const fetch = require('node-fetch');
const { Server } = require('socket.io');
const vanRoutes = require('./Routes/vanRoutes');
const uploadRoutes = require('./Routes/imageUploadRoutes');
const reviewRoutes = require('./Routes/reviewRoutes');
const bookingSettingsRoutes = require('./Routes/BookingSettingsRoutes');
const bookingRoutes = require('./Routes/bookingRoutes');
const adminRegistrationStatusRoute = require('./Routes/adminRegistrationStatus');
const authRoutes = require('./Routes/authRoutes');
const NotificationRoutes = require('./Routes/notificationRoutes');
const cookieParser = require("cookie-parser");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); 
const cors = require('cors');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  }
});

app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173", 
    credentials: true
}));

// Define routes with base path
app.use('/api/vans', vanRoutes);
app.use('/api', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api', bookingRoutes);
app.use('/api', authRoutes);
app.use('/api', bookingSettingsRoutes(io));
app.use('/api/admin', adminRegistrationStatusRoute);
app.use('/api', NotificationRoutes(io));

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on("join", (userId) => {
        console.log(`User ${userId} joined room ${userId}`);
        socket.join(userId);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});


// Multer Storage Configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Stripe Payment Routes
app.post(
    '/api/create-checkout-session',
    upload.fields([
        { name: 'driverLicenseFront', maxCount: 1 },
        { name: 'driverLicenseBack', maxCount: 1 },
        { name: 'idDocumentFront', maxCount: 1 },
        { name: 'idDocumentBack', maxCount: 1 },
    ]),
    async (req, res) => {
        const { firstName, lastName, address, email } = req.body;

        // Access files via `buffer`
        const driverLicenseFront = req.files.driverLicenseFront[0].buffer.toString('base64');
        const driverLicenseBack = req.files.driverLicenseBack[0].buffer.toString('base64');
        const idDocumentFront = req.files.idDocumentFront[0].buffer.toString('base64');
        const idDocumentBack = req.files.idDocumentBack[0].buffer.toString('base64');

        try {
            const customer = await stripe.customers.create({
                email,
                name: `${firstName} ${lastName}`,
                address: { line1: address },
                metadata: {
                    driverLicenseFront,
                    driverLicenseBack,
                    idDocumentFront,
                    idDocumentBack,
                },
            });

            const paymentIntent = await stripe.paymentIntents.create({
                amount: 5000,
                currency: 'usd',
                payment_method_types: ['card'],
                capture_method: 'manual',
                customer: customer.id,
                metadata: { firstName, lastName, address, email },
            });

            console.log('Pre-authorization PaymentIntent:', paymentIntent.id);

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                customer: customer.id,
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Premium Van Booking' },
                        unit_amount: 30000,
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${req.headers.origin}/cancel`,
            });

            res.json({ id: session.id, paymentIntentId: paymentIntent.id });
        } catch (err) {
            console.error('Stripe error:', err);
            res.status(500).json({ error: err.message });
        }
    }
);

// Capture Payment Route
app.post('/api/capture-payment', async (req, res) => {
    const { paymentIntentId, amountToCapture } = req.body;

    try {
        const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId, {
            amount_to_capture: amountToCapture,
        });
        res.json(paymentIntent);
    } catch (err) {
        console.error('Capture payment error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Retrieve Payment Session
app.get('/api/payment-session/:sessionId', async (req, res) => {
    const { sessionId } = req.params;

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        res.json(session);
    } catch (error) {
        console.error('Retrieve session error:', error);
        res.status(500).json({ error: error.message });
    }
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
