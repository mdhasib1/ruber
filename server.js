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
const webhookRoutes = require('./Routes/webhookRoutes');
const packageRoutes = require('./Routes/packageRoutes');
const contractRuleRoutes = require('./Routes/contractRuleRoutes');
const PreAuthorizationRoutes = require('./Routes/preAuthorizationRoutes');
const adminRoutes = require('./Routes/adminRoutes');
const fleet2TrackRoutes = require('./Routes/fleet2TrackRoutes');
const faq = require('./Routes/FaqRoutes');
const partnerRoutes = require('./Routes/partnerRoutes');
const partnersRoutes = require('./Routes/PartnersRoutes')
const cookieParser = require("cookie-parser");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); 
const cors = require('cors');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const SitereviewRoutes = require("./Routes/SiteReviewRoutes");
const path = require('path');


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


app.use('/api/vans', vanRoutes);
app.use('/api', uploadRoutes);
app.use('/api', reviewRoutes);
app.use('/api', bookingRoutes(io));
app.use('/api', authRoutes);
app.use('/api', bookingSettingsRoutes(io));
app.use('/api/admin', adminRegistrationStatusRoute);
app.use('/api', NotificationRoutes(io));
app.use('/api/packages', packageRoutes);
app.use('/api', webhookRoutes);
app.use('/api', PreAuthorizationRoutes);
app.use('/api', contractRuleRoutes);
app.use('/api', adminRoutes(io));
app.use('/api/reviews', SitereviewRoutes);
app.use('/api', faq);
// app.use('/api', partnerRoutes);
app.use('/api', partnersRoutes);
app.use("/api/fleet2track", fleet2TrackRoutes);


global.io = io;

io.on('connection', (socket) => {
    socket.on("join", (userId) => {
        socket.join(userId);
        console.log(`User joined room: ${userId}`);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});


const storage = multer.memoryStorage();
const upload = multer({ storage });


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


app.get('/api/payment-session/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
  
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      res.json({
        id: session.id,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_details: session.customer_details,
      });
    } catch (error) {
      console.error('Retrieve session error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  

const reactAppBuildPath = path.join(__dirname, '..', 'ruberdist');
app.use(express.static(reactAppBuildPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(reactAppBuildPath, 'index.html'));
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
