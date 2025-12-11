// server/index.ts
import 'dotenv/config';
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import socketio from 'fastify-socket.io';
import multipart from '@fastify/multipart';
import { Server as SocketIOServer } from 'socket.io';
import adminRoutes from './src/routes/adminRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import auctionRoutes from './src/routes/auctionRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import internalRoutes from './src/routes/internalRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import { socketAuth } from './src/middleware/authMiddleware.js';
import registerAuctionHandlers, { recoverActiveAuctions, startScheduledAuctionChecker } from './src/sockets/auctionSocket.js';
import registerChatHandlers from './src/sockets/chatSocket.js';
import { AuthenticatedSocket } from './src/types/socket.js';

// Extend Fastify instance to include socket.io
declare module 'fastify' {
  interface FastifyInstance {
    io: SocketIOServer;
  }
}

// 1. Init Fastify (Logger on buat debugging)
const fastify = Fastify({ logger: true });

// 2. Register Plugins
// CORS
fastify.register(cors, {
  origin: [process.env.CLIENT_URL || "http://localhost:8080", "http://localhost:5173"],
  methods: ["GET", "POST"],
  credentials: true
});

// Socket.io
fastify.register(socketio, {
  cors: {
    origin: [process.env.CLIENT_URL || "http://localhost:8080", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  },
  // Heartbeat configuration
  pingTimeout: 20000,    // Waktu tunggu sebelum menganggap client disconnect (20 detik)
  pingInterval: 25000,   // Interval ping dari server ke client (25 detik)
  connectTimeout: 45000  // Timeout untuk initial connection (45 detik)
});

// 3. Register Routes (Prefixing lebih gampang di Fastify)
fastify.register(adminRoutes, { prefix: '/admin' });
fastify.register(authRoutes, { prefix: '/auth' });
fastify.register(auctionRoutes, { prefix: '/auctions' });
fastify.register(notificationRoutes, { prefix: '/notifications' });
fastify.register(internalRoutes, { prefix: '/internal' });
fastify.register(chatRoutes, { prefix: '/chat' });

// Untuk 
fastify.register(multipart, {
    limits: {
        fileSize: 5 * 1024 * 1024 // Batas 5MB
    }
});
fastify.register(uploadRoutes, { prefix: '/' });
fastify.register(paymentRoutes, { prefix: '/payment' });
// 4. Root Route
fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
  return { status: 'ok', message: 'Nimonspedia Node.js Server is Running...' };
});

// 5. Start Server
const start = async (): Promise<void> => {
  try {
    await fastify.ready();

    fastify.io.use(socketAuth); 

    fastify.io.on('connection', (socket) => {
      const authSocket = socket as AuthenticatedSocket;
      fastify.log.info(`User Connected: ${authSocket.user?.name} (${authSocket.user?.user_id})`);
      registerAuctionHandlers(fastify.io, authSocket);
      registerChatHandlers(fastify.io, authSocket);
      
      socket.on('disconnect', () => {
        fastify.log.info(`User Disconnected ${socket.id}`);
      });
    });

    recoverActiveAuctions(fastify.io);
    startScheduledAuctionChecker(fastify.io);
    
    const PORT = parseInt(process.env.PORT || '3000');
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`SERVER RUNNING ON PORT ${PORT}`);

  } catch (err: unknown) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();