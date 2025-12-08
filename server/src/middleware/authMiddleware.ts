// server/src/middleware/authMiddleware.ts
import redisClient from '../config/redis.js';
import { unserializeSession } from 'php-unserialize';
import cookie from 'cookie';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { FastifyRequest, FastifyReply } from 'fastify';
import { Socket } from 'socket.io';

// --- Interface Definitions (Tetap Sama) ---
interface UserSession {
  user_id: string;
  role: string;
  name: string;
}

interface AuthTokenPayload extends JwtPayload {
  user_id: string;
  role: string;
  name: string;
}

interface AuthenticatedSocket extends Socket {
  user?: UserSession;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserSession;
  }
}

// Helper untuk ambil user dari PHP Redis
const getPHPUser = async (cookieString?: string): Promise<UserSession | null> => {
    if (!cookieString) return null;

    const cookies = cookie.parse(cookieString);
    const sessionID = cookies.PHPSESSID;

    if (!sessionID) return null;

    const sessionKey = `PHPREDIS_SESSION:${sessionID}`;
    const rawSession = await redisClient.get(sessionKey);

    if (!rawSession) return null;

    try {
        const sessionData = unserializeSession(rawSession) as any;
        
        if (!sessionData.user_id) return null;

        return {
            user_id: String(sessionData.user_id),
            role: sessionData.role || 'BUYER',
            name: sessionData.name || 'User'
        };
    } catch (err) {
        console.error("Error parsing PHP session:", err);
        return null;
    }
}

/**
 * Middleware Socket.io (Hybrid: Token OR Session)
 */
const socketAuth = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
    try {
        // CARA 1: Cek JWT Token (Untuk Admin)
        const token = socket.handshake.auth.token;
        if (token) {
            try {
                const secret = process.env.JWT_SECRET || 'rahasia_negara_nimons';
                const decoded = jwt.verify(token, secret) as AuthTokenPayload;
                
                socket.user = {
                    user_id: decoded.user_id,
                    role: decoded.role,
                    name: decoded.name
                };
                return next(); // Sukses via Token
            } catch (err) {
                // Token invalid/expired? Jangan error dulu, coba cek session PHP siapa tau dia user biasa
                console.log("Token invalid, falling back to PHP Session check...");
            }
        }

        // CARA 2: Cek PHP Session Cookie (Untuk User Biasa)
        const cookieString = socket.handshake.headers.cookie;
        const user = await getPHPUser(cookieString);

        if (user) {
            socket.user = user;
            return next(); // Sukses via Session
        }

        // Gagal keduanya
        return next(new Error("Unauthorized: No valid Token or Session found"));

    } catch (err) {
        console.error("Socket Auth Exception:", err);
        next(new Error("Authentication Error"));
    }
};

/**
 * Middleware HTTP (Hybrid)
 */
const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    // Cek Header Auth (JWT)
    const authHeader = request.headers['authorization'];
    if (authHeader) {
        try {
            const token = authHeader.split(' ')[1];
            const secret = process.env.JWT_SECRET || 'rahasia_negara_nimons';
            const decoded = jwt.verify(token, secret) as AuthTokenPayload;
            request.user = decoded;
            return;
        } catch(e) {}
    }

    // Cek Cookie (PHP Session)
    const user = await getPHPUser(request.headers.cookie);
    if (!user) {
        return reply.status(401).send({ 
            success: false, 
            message: 'Unauthorized: Please login first' 
        });
    }
    request.user = user;
};

const verifyAdminToken = async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 
  
    if (!token) {
      return reply.status(401).send({ success: false, message: 'Access denied. No token provided.' });
    }
  
    try {
      const secret = process.env.JWT_SECRET || 'rahasia_negara_nimons';
      const decoded = jwt.verify(token, secret) as AuthTokenPayload;
      
      if (decoded.role !== 'ADMIN') {
          return reply.status(403).send({ success: false, message: 'Access denied. Admins only.' });
      }
  
      request.user = decoded;
    } catch (err) {
      return reply.status(403).send({ success: false, message: 'Invalid or expired token.' });
    }
};

export { requireAuth, socketAuth, verifyAdminToken };