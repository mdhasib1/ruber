const express = require('express');
const router = express.Router();
const { getNotifications, getNotificationById, markNotificationAsRead } = require('../Controllers/notificationController');
const { createNotification } = require('../helpers/notificationHelper');
const { authenticateToken } = require('../middlewares/authMiddleware');

module.exports = (io) => {
    router.get('/notifications', authenticateToken, getNotifications);
    router.get('/notifications/:notificationId', authenticateToken, getNotificationById);
    router.put('/notifications/:notificationId/read', authenticateToken, markNotificationAsRead);

    router.post('/notifications', authenticateToken, async (req, res) => {
        try {
            const notification = await createNotification(io, req.body);
            res.status(201).json(notification);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create notification' });
        }
    });

    return router;
};
