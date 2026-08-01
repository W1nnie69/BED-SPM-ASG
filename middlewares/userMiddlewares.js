const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = decoded;
        next();
    });
}

function requireRole(allowedTypes) {
    return (req, res, next) => {
        if (!allowedTypes.includes(req.user.userType)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        next();
    };
}

function checkIfUserQueryingMatchesID(req, res, next) {
    if (!(req.user.userId === req.params.id)) {
        // ID no match!!!!!!!!
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
}

module.exports = {
    verifyToken,
    requireRole,
    checkIfUserQueryingMatchesID
};