const express = require('express');
const adminController = require('../Controllers/adminController');
const { authenticateToken,  authorizeAdmin } = require('../middlewares/authMiddleware');


module.exports = (io) => {
    const router = express.Router();
    router.get('/dashboard/stats',authenticateToken,authorizeAdmin, (req, res) => adminController.getDashboardStats(req, res, io));  
    router.get('/getAllBookings',authenticateToken,authorizeAdmin, (req, res) => adminController.getAllBookings(req, res, io));
    return router;
  };
  
