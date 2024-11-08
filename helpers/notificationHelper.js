const Notification = require('../Models/Notification');


const fetchNotifications = async (userId) => {
    try {
        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
        return notifications;
    } catch (error) {
        console.error('Error retrieving notifications:', error);
        throw error;
    }
};


const createNotification = async (io, { title, message, userId }) => {
    try {
        const notification = new Notification({ title, message, userId });
        await notification.save();

        if (userId) {
            io.to(userId.toString()).emit('notification', notification);
        } else {
            io.emit('notification', notification);
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

module.exports = { createNotification, fetchNotifications };
