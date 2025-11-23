const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Import Routes
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Setup Socket.io (WebSocket)
const io = new Server(server, {
  cors: {
    // koneksi dari React (Vite default port 5173 atau Nginx 8080)
    origin: [process.env.CLIENT_URL || "http://localhost:8080", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true 
  }
});

app.use(cors());
app.use(express.json());

// Routing API
app.use('/api/node/admin', adminRoutes);

// Root Endpoint (Health Check)
app.get('/', (req, res) => {
  res.send('Nimonspedia Node.js Server is Running...');
});

const registerAuctionHandlers = require('./src/sockets/auctionSocket');
const registerChatHandlers = require('./src/sockets/chatSocket');

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  registerAuctionHandlers(io, socket);
  registerChatHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});