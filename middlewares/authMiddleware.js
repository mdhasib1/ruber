const jwt = require('jsonwebtoken');
const User = require("../Models/User.Schema");


const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.id); // Use 'id' if '_id' doesn't work
        if (!user) return res.status(404).json({ error: 'User not found' });

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ error: 'Token expired', needRefresh: true });
        }
        res.status(403).json({ error: 'Invalid token' });
    }
};



const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

module.exports = {
    authenticateToken,
    authorizeAdmin,
};
