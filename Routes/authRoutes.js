const express = require('express');
const { register, verifyOtp ,sendLoginOtp,existAccount, userProfile,refreshToken,logout } = require('../Controllers/authController');
const { authenticateToken,  authorizeAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', sendLoginOtp);
router.post('/exist-account', existAccount);
router.post('/user-profile',authenticateToken, userProfile);
router.post('/refresh-token', refreshToken);
router.post("/logout", logout);


module.exports = router;
