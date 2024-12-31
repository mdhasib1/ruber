const { authenticate, ensureToken, lockUnlockVehicle } = require("../utils/fleet2TrackService");


const authController = async (req, res) => {
    try {
        const token = await authenticate();
        res.json({ message: "Authenticated successfully", token });
    } catch (error) {
        res.status(500).json({ message: "Error authenticating", error: error.message });
    }
};


const smartLockController = async (req, res) => {
    try {
        const { plate, enableLock } = req.body;
        await ensureToken();
        const response = await lockUnlockVehicle(plate, enableLock);
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: "Error locking/unlocking", error: error.message });
    }
};

module.exports = {
    authController,
    smartLockController,
};
