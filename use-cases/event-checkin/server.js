'use strict';

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const db = require('./db');
const checkinRoutes = require('./routes/checkin');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3030;

// Make io available to routes via app.locals
app.locals.io = io;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/participants', checkinRoutes);
app.use('/api/admin', adminRoutes);

// Serve check-in page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ─── WebSocket ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
db.init();

server.listen(PORT, () => {
  console.log(`Event Check-in System running at http://localhost:${PORT}`);
  console.log(`  Check-in page: http://localhost:${PORT}/`);
  console.log(`  Admin page:    http://localhost:${PORT}/admin`);
});
