const Notification = require('../Models/Notification');
const { fetchNotifications } = require('../helpers/notificationHelper');



const getNotifications = async (req, res) => {
    const { id } = req.user;

    try {
        const notifications = await fetchNotifications(id);
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error retrieving notifications:', error);
        res.status(500).json({ error: 'Failed to retrieve notifications' });
    }
};


const getNotificationById = async (req, res) => {
    const { notificationId } = req.params;

    try {
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.status(200).json(notification);
    } catch (error) {
        console.error('Error retrieving notification:', error);
        res.status(500).json({ error: 'Failed to retrieve notification' });
    }
};

// Mark a specific notification as read
const markNotificationAsRead = async (req, res) => {
    const { notificationId } = req.params;

    try {
        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.status(200).json({ message: 'Notification marked as read', notification });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
};

module.exports = {
    getNotifications,
    getNotificationById,
    markNotificationAsRead,
};
