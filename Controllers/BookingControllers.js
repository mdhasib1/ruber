const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); 
const Booking = require('../Models/Booking.Schema.js');
const Van = require('../Models/Van.Schema.js');
const User = require('../Models/User.Schema.js');
const Driver = require('../Models/Driver.Schema.js');

const createBooking = async (req, res) => {
    const {
        vanId,
        startDate,
        endDate,
        startTime,
        endTime,
        totalPrice,
        firstName,
        lastName,
        address,
        email,
        phone,
        driverFirstName,
        driverLastName,
        driverEmail,
        driverPhone
    } = req.body;

    const driverLicenseFront = req.files.driverLicenseFront[0].buffer.toString('base64');
    const driverLicenseBack = req.files.driverLicenseBack[0].buffer.toString('base64');
    const idDocumentFront = req.files.idDocumentFront[0].buffer.toString('base64');
    const idDocumentBack = req.files.idDocumentBack[0].buffer.toString('base64');

    try {
        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                firstName,
                lastName,
                email,
                phone
            });
            await user.save();
        }


        const isDifferentDriver = driverFirstName !== firstName || driverLastName !== lastName || driverEmail !== email || driverPhone !== phone;
        let driver = null;

        if (isDifferentDriver) {
            driver = await Driver.findOne({ email: driverEmail });

            if (!driver) {
                driver = new Driver({
                    userId: user._id,
                    firstName: driverFirstName,
                    lastName: driverLastName,
                    email: driverEmail,
                    phone: driverPhone,
                    licenseFront: driverLicenseFront,
                    licenseBack: driverLicenseBack,
                    idDocumentFront,
                    idDocumentBack
                });
                await driver.save();
            }
        }

        // Create or retrieve Stripe customer
        const customer = await stripe.customers.create({
            email,
            name: `${firstName} ${lastName}`,
            address: { line1: address },
            metadata: {
                driverLicenseFront,
                driverLicenseBack,
                idDocumentFront,
                idDocumentBack,
                ...(isDifferentDriver && { driverFirstName, driverLastName, driverEmail, driverPhone })
            }
        });

        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalPrice,
            currency: 'usd',
            payment_method_types: ['card'],
            capture_method: 'manual',
            customer: customer.id
        });


        const booking = await Booking.create({
            userId: user._id,
            vanId,
            startDate,
            endDate,
            startTime,
            endTime,
            totalPrice,
            paymentIntentId: paymentIntent.id,
            driverId: isDifferentDriver ? driver._id : null
        });

        res.json({ booking, paymentIntentId: paymentIntent.id });
    } catch (err) {
        console.error("Booking error:", err);
        res.status(500).json({ error: err.message });
    }
};

const extendBookingRequest = async (req, res) => {
    const { startDate, endDate, startTime, endTime } = req.body;

    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        const overlappingBooking = await Booking.findOne({
            vanId: booking.vanId,
            startDate: { $lte: endDate },
            endDate: { $gte: startDate },
            startTime: { $lt: endTime },
            endTime: { $gt: startTime },
            _id: { $ne: booking._id }
        });

        if (overlappingBooking) {
            const alternateVan = await Van.findOne({ isAvailable: true });
            if (alternateVan) {
                booking.alternateVanId = alternateVan._id;
            }
            booking.extensionStatus = 'pending';
        } else {
            booking.extensionRequested = { startDate, endDate, startTime, endTime };
            booking.extensionStatus = 'approved';
        }

        await booking.save();
        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

const confirmExtension = async (req, res) => {
    const { action } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (action === 'approve') {
        booking.extensionStatus = 'approved';
        booking.startDate = booking.extensionRequested.startDate;
        booking.endDate = booking.extensionRequested.endDate;
        booking.startTime = booking.extensionRequested.startTime;
        booking.endTime = booking.extensionRequested.endTime;
    } else {
        booking.extensionStatus = 'rejected';
        booking.extensionRequested = null;
    }

    await booking.save();
    res.json(booking);
};

const switchVan = async (req, res) => {
    const { alternateVanId } = req.body;
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        booking.vanId = alternateVanId;
        booking.extensionStatus = 'approved';
        await booking.save();

        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createBooking,
    extendBookingRequest,
    confirmExtension,
    switchVan
};
