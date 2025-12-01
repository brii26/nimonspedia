// server/index.ts
import 'dotenv/config';
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import socketio from 'fastify-socket.io';
import { Server as SocketIOServer } from 'socket.io';
import { Socket } from 'socket.io';

import adminRoutes from './src/routes/adminRoutes.js';
import { socketAuth } from './src/middleware/authMiddleware.js';
import registerAuctionHandlers from './src/sockets/auctionSocket.js';
import registerChatHandlers from './src/sockets/chatSocket.js';

// Extend Fastify instance to include socket.io
declare module 'fastify' {
  interface FastifyInstance {
    io: SocketIOServer;
  }
}

// Extended Socket interface with user property
interface AuthenticatedSocket extends Socket {
  user?: {
    user_id: string;
    role: string;
    name: string;
  };
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
  }
});

// 3. Register Routes (Prefixing lebih gampang di Fastify)
fastify.register(adminRoutes, { prefix: '/admin' });

// 4. Root Route
fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
  return { status: 'ok', message: 'Nimonspedia Node.js Server is Running...' };
});

// 5. Start Server
const start = async (): Promise<void> => {
  try {
    await fastify.ready();

    fastify.io.use(socketAuth); 

    fastify.io.on('connection', (socket: AuthenticatedSocket) => {
      fastify.log.info(`User Connected: ${socket.user?.name} (${socket.user?.user_id})`);
      registerAuctionHandlers(fastify.io, socket);
      registerChatHandlers(fastify.io, socket);
      
      socket.on('disconnect', () => {
        fastify.log.info(`User Disconnected ${socket.id}`);
      });
    });

    const PORT = parseInt(process.env.PORT || '3000');
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`SERVER RUNNING ON PORT ${PORT}`);

  } catch (err: unknown) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();