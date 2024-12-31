const express = require("express");
const { authController, smartLockController } = require("../Controllers/fleet2TrackController");

const router = express.Router();

router.post("/authenticate", authController);
router.post("/smartlock", smartLockController);

module.exports = router;
