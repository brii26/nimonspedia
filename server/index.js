// server/index.js
require('dotenv').config();
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const socketio = require('fastify-socket.io');

const adminRoutes = require('./src/routes/adminRoutes');
const { socketAuth } = require('./src/middleware/authMiddleware');

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
fastify.get('/', async (request, reply) => {
  return { status: 'ok', message: 'Nimonspedia Node.js Server is Running...' };
});

// 5. Start Server
const start = async () => {
  try {
    await fastify.ready();

    fastify.io.use(socketAuth); 

    const registerAuctionHandlers = require('./src/sockets/auctionSocket');
    const registerChatHandlers = require('./src/sockets/chatSocket');

    fastify.io.on('connection', (socket) => {
      fastify.log.info(`User Connected: ${socket.user?.name} (${socket.user?.user_id})`);
      registerAuctionHandlers(fastify.io, socket);
      registerChatHandlers(fastify.io, socket);
      
      socket.on('disconnect', () => {
        fastify.log.info(`User Disconnected ${socket.id}`);
      });
    });

    const PORT = process.env.PORT || 3000;
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`SERVER RUNNING ON PORT ${PORT}`);

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();