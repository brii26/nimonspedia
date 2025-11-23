const redisClient = require('../config/redis');
const { unserializeSession } = require('php-unserialize');
const cookie = require('cookie');

const getPHPUser = async (cookieString) => {
    if (!cookieString) return null;

    const cookies = cookie.parse(cookieString);
    const sessionID = cookies.PHPSESSID;

    if (!sessionID) return null;

    const sessionKey = `PHPREDIS_SESSION:${sessionID}`;
    const rawSession = await redisClient.get(sessionKey);

    if (!rawSession) return null;

    try {
        const sessionData = unserializeSession(rawSession);
        
        if (!sessionData.user_id) return null;

        return {
            user_id: sessionData.user_id,
            role: sessionData.role,
            name: sessionData.name || 'User'
        };
    } catch (err) {
        return null;
    }
}

/**
 * Middleware untuk Express (HTTP Routes)
 * Dipakai untuk route API yang butuh login
 */
const requireAuth = async (req, res, next) => {
    try {
        const user = await getPHPUser(req.headers.cookie);
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized: Login in PHP first' 
            });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(500).json({ message: 'Server Error during Auth' });
    }
};

/**
 * Middleware untuk Socket.io (WebSocket)
 * Dipakai agar user yang connect ke socket wajib login
 */
const socketAuth = async (socket, next) => {
    try {
        const cookieString = socket.handshake.headers.cookie;
        const user = await getPHPUser(cookieString);

        if (!user) {
            return next(new Error("Unauthorized: Invalid Session"));
        }

        socket.user = user;
        next();
    } catch (err) {
        next(new Error("Authentication Error"));
    }
};

const verifyAdminToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>
  
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }
  
    try {
      const secret = process.env.JWT_SECRET || 'rahasia_negara_nimons';
      const decoded = jwt.verify(token, secret);
      
      if (decoded.role !== 'ADMIN') {
          return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
      }
  
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }
};

module.exports = { requireAuth, socketAuth, verifyAdminToken };