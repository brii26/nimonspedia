import redisClient from '../config/redis.js';
import { unserializeSession } from 'php-unserialize';
import cookie from 'cookie';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { FastifyRequest, FastifyReply } from 'fastify';
import { Socket } from 'socket.io';

// Type definitions
interface UserSession {
  user_id: string;
  role: string;
  name: string;
}

interface SessionData {
  user_id?: string;
  role?: string;
  name?: string;
}

interface AuthTokenPayload extends JwtPayload {
  user_id: string;
  role: string;
  name: string;
}

interface AuthenticatedSocket extends Socket {
  user?: UserSession;
}

// Declare module augmentation for Fastify
declare module 'fastify' {
  interface FastifyRequest {
    user?: UserSession;
  }
}

const getPHPUser = async (cookieString?: string): Promise<UserSession | null> => {
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
 * Middleware untuk Fastify (HTTP Routes)
 * Dipakai untuk route API yang butuh login
 */
const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const user = await getPHPUser(request.headers.cookie);
        
        if (!user) {
            return reply.status(401).send({ 
                success: false, 
                message: 'Unauthorized: Login in PHP first' 
            });
        }

        request.user = user;
    } catch (err) {
        return reply.status(500).send({ message: 'Server Error during Auth' });
    }
};

/**
 * Middleware untuk Socket.io (WebSocket)
 * Dipakai agar user yang connect ke socket wajib login
 */
const socketAuth = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
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

const verifyAdminToken = async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>
  
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