import { FastifyRequest, FastifyReply } from 'fastify';
import { Socket } from 'socket.io';
interface UserSession {
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
/**
 * Middleware untuk Fastify (HTTP Routes)
 * Dipakai untuk route API yang butuh login
 */
declare const requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
/**
 * Middleware untuk Socket.io (WebSocket)
 * Dipakai agar user yang connect ke socket wajib login
 */
declare const socketAuth: (socket: AuthenticatedSocket, next: (err?: Error) => void) => Promise<void>;
declare const verifyAdminToken: (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
export { requireAuth, socketAuth, verifyAdminToken };
//# sourceMappingURL=authMiddleware.d.ts.map