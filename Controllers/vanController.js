const Van = require('../Models/Van.Schema.js');
const Booking = require('../Models/Booking.Schema.js'); 

const getAllVans = async (req, res) => {
    try {
        const vans = await Van.find({ status: 'approved' });
        res.status(200).json(vans);
    } catch (error) {
        console.error("Error fetching vans:", error);
        res.status(500).json({ message: "Failed to fetch vans." });
    }
};


const getBookedSlotsForVan = async (req, res) => {
    const { vanId } = req.params;
    try {
        const bookings = await Booking.find({
            vanId: vanId,
            status: { $in: ['accepted', 'pending'] }
        }).select('selectedSlots status');

        if (!bookings  || bookings.length === 0) {
            return res.status(404).json({ message: "No booked slots found for this van." });
        }

        const bookedSlots = bookings.map((booking) => ({
            selectedSlots: booking.selectedSlots.map((slot) => {
                const [day, month, year] = slot.date.split("-");
                const formattedDate = `${year}-${month}-${day}`;

                return {
                    date: formattedDate,
                    time: slot.time,
                };
            }),
            status: booking.status
        }));

        res.status(200).json(bookedSlots);
    } catch (error) {
        console.error("Error fetching booked slots:", error);
        res.status(500).json({ message: "Failed to fetch booked slots for van." });
    }
};



const getVanById = async (req, res) => {
    const { id } = req.params;

    try {
        const van = await Van.findById(id);
        if (!van) {
            return res.status(404).json({ message: "Van not found" });
        }
        res.status(200).json(van);
    } catch (error) {
        console.error("Error fetching van by ID:", error);
        res.status(500).json({ message: "Failed to fetch van." });
    }
};

const addVan = async (req, res) => {
    const {
      name,
      description,
      images,
      plateNumber,
      externalDimensions,
      internalDimensions,
      weight,
      location,
      dailyPricing,
      restrictedBookingHours,
      fuelType,
      transmissionType,
      optionalFeatures,
      contractImages,
      trackingDevice,
    } = req.body;
  
    if (!name || !description || !plateNumber || !fuelType || !transmissionType || !dailyPricing) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const formattedDailyPricing = Object.keys(dailyPricing).map((day) => ({
      day,
      pricePerHour: parseFloat(dailyPricing[day].pricePerHour),
      kilometers: parseFloat(dailyPricing[day].kilometers),
      extraPerKm: parseFloat(dailyPricing[day].extraPerKm),
    }));
  
    const newVan = new Van({
      userId: req.user._id,
      name,
      description,
      images,
      plateNumber,
      externalDimensions,
      internalDimensions,
      weight,
      location,
      dailyPricing: formattedDailyPricing, 
      restrictedBookingHours,
      fuelType,
      transmissionType,
      optionalFeatures,
      contractImages,
      trackingDevice,
      status: 'approved',
    });
  
    try {
      const savedVan = await newVan.save();
      console.log("Van saved successfully:", savedVan);
      res.status(201).json(savedVan);
    } catch (error) {
      console.error("Error saving van:", error);
      res.status(500).json({ message: "Failed to save van. Please try again later." });
    }
  };

  const addVanPartner = async (req, res) => {
    console.log("Request body:", req.body);
    console.log("Request user:", req.user);
    const userId = req.user._id;
    const {
        name,
        description,
        images,
        plateNumber,
        externalDimensions,
        internalDimensions,
        weight,
        location,
        restrictedBookingHours,
        fuelType,
        transmissionType,
        optionalFeatures,
        contractImages,
        trackingDevice,
    } = req.body;

    if (!name || !description || !plateNumber || !fuelType || !transmissionType ) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    const newVan = new Van({
        userId: userId,
        name,
        description,
        images,
        plateNumber,
        externalDimensions,
        internalDimensions,
        weight,
        location,
        restrictedBookingHours,
        fuelType,
        transmissionType,
        optionalFeatures,
        contractImages,
        trackingDevice,
        status: 'pending',
    });

    try {
        const savedVan = await newVan.save();
        console.log("Van saved successfully:", savedVan);
        res.status(201).json(savedVan);
    }
    catch (error) {
        console.error("Error saving van:", error);
        res.status(500).json({ message: "Failed to save van. Please try again later." });
    }
};


  

// Update a van by ID
const updateVan = async (req, res) => {
    const { id } = req.params;

    try {
        const updatedVan = await Van.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedVan) {
            return res.status(404).json({ message: "Van not found" });
        }
        res.status(200).json(updatedVan);
    } catch (error) {
        console.error("Error updating van:", error);
        res.status(400).json({ message: "Failed to update van." });
    }
};

// Delete a van by ID
const deleteVan = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedVan = await Van.findByIdAndDelete(id);
        if (!deletedVan) {
            return res.status(404).json({ message: "Van not found" });
        }
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting van:", error);
        res.status(400).json({ message: "Failed to delete van." });
    }
};

const addContractImages = async (req, res) => {
    const { id } = req.params;
    const contractImages = req.body; // Expecting this to be an array of contract image objects

    if (!Array.isArray(contractImages) || !contractImages.length) {
        return res.status(400).json({ message: "Invalid or empty contract images array" });
    }

    try {
        const van = await Van.findById(id);
        if (!van) {
            return res.status(404).json({ message: "Van not found" });
        }

        // Append new images to existing contract images
        van.contractImages = [...van.contractImages, ...contractImages];
        await van.save();

        res.status(200).json(van.contractImages);
    } catch (error) {
        console.error("Error adding contract images:", error);
        res.status(400).json({ message: "Failed to add contract images." });
    }
};


const removeContractImage = async (req, res) => {
    const { id } = req.params;
    const { imageId } = req.body;

    try {
        const van = await Van.findById(id);
        if (!van) {
            return res.status(404).json({ message: "Van not found" });
        }
        van.contractImages = van.contractImages.filter(
            (contractImage) => contractImage.image !== imageId
        );

        await van.save();
        res.status(200).json({ message: "Contract image removed successfully", contractImages: van.contractImages });
    } catch (error) {
        console.error("Error removing contract image:", error);
        res.status(400).json({ message: "Failed to remove contract image." });
    }
};

const approveVan = async (req, res) => {
    const { id } = req.params;
    let { dailyPricing } = req.body;

    if (!id || id === "null") {
        return res.status(400).json({ message: "Invalid van ID." });
    }

    if (!Array.isArray(dailyPricing) || dailyPricing.length !== 7) {
        return res.status(400).json({
            message: "Daily pricing must be provided for all 7 days of the week.",
        });
    }

    const daysOfWeek = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ];
    dailyPricing = dailyPricing.map((pricing, index) => ({
        day: daysOfWeek[index],
        pricePerHour: pricing.pricePerHour,
        kilometers: pricing.kilometers,
        extraPerKm: pricing.extraPerKm,
    }));

    try {
        const van = await Van.findById(id);

        if (!van) {
            return res.status(404).json({ message: "Van not found." });
        }

        if (van.status !== "pending") {
            return res
                .status(400)
                .json({ message: "Van is not in a pending state." });
        }

        // Update dailyPricing and approve the van
        van.dailyPricing = dailyPricing;
        van.status = "approved";
        await van.save();

        res.status(200).json({ message: "Van approved successfully.", van });
    } catch (error) {
        console.error("Error approving van:", error);
        res.status(500).json({ message: "Failed to approve van." });
    }
};


const rejectVan = async (req, res) => {
    const { id } = req.params;

    if (!id || id === "null") {
        return res.status(400).json({ message: "Invalid van ID." });
    }

    try {
        const van = await Van.findById(id);

        if (!van) {
            return res.status(404).json({ message: "Van not found." });
        }

        if (van.status !== "pending") {
            return res
                .status(400)
                .json({ message: "Van is not in a pending state." });
        }

        van.status = "rejected";
        await van.save();

        res.status(200).json({ message: "Van rejected successfully.", van });
    } catch (error) {
        console.error("Error rejecting van:", error);
        res.status(500).json({ message: "Failed to reject van." });
    }
};


const MyVans = async (req, res) => {
    const userId = req.user._id;
    console.log("User ID:", userId);
    try {
        const vans = await Van.find({ userId});
        res.status(200).json(vans);
    } catch (error) {
        console.error("Error fetching vans:", error);
        res.status(500).json({ message: "Failed to fetch vans." });
    }
}

const getAllVansAdmin = async (req, res) => {
    try {
        const vans = await Van.find();
        res.status(200).json(vans);
    } catch (error) {
        console.error("Error fetching vans:", error);
        res.status(500).json({ message: "Failed to fetch vans." });
    }
};



module.exports = {
    getAllVans,
    addVan,
    updateVan,
    getVanById,
    deleteVan,
    addContractImages,
    removeContractImage,
    getBookedSlotsForVan,
    approveVan,
    rejectVan,
    MyVans,
    addVanPartner,
    getAllVansAdmin
};
