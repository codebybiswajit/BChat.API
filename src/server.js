import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import logger from './config/logger.js';
import dns from "node:dns";
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import chatRoutes from './routes/chat.routes.js';
import messageRoutes from './routes/message.routes.js';
import uploadRoutes from './routes/upload.routes.js';


dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/upload', uploadRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Socket.io Setup
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  },
});

io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);

  socket.on('setup', (userData) => {
    if(userData && userData._id) {
      socket.join(userData._id);
      socket.emit('connected');
      logger.info(`User ${userData._id} connected to personal socket room`);
    }
  });

  socket.on('join chat', (room) => {
    socket.join(room);
    logger.info(`User Joined Room: ${room}`);
  });

  socket.on('typing', (room) => socket.in(room).emit('typing'));
  socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

  socket.on('new message', (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return logger.info('chat.users not defined');

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;
      socket.in(user._id).emit('message recieved', newMessageRecieved);
    });
  });

  socket.on('message edited', (updatedMessage) => {
    var chat = updatedMessage.chat;
    if (!chat.users) return;
    chat.users.forEach((user) => {
      if (user._id == updatedMessage.sender._id) return;
      socket.in(user._id).emit('message updated', updatedMessage);
    });
  });

  socket.on('message deleted', (deletedMessage) => {
    var chat = deletedMessage.chat;
    if (!chat.users) return;
    chat.users.forEach((user) => {
      if (user._id == deletedMessage.sender._id) return;
      socket.in(user._id).emit('message updated', deletedMessage);
    });
  });

  // WebRTC Call Events
  socket.on('callUser', (data) => {
    socket.in(data.userToCall).emit('callUser', {
      signal: data.signalData,
      from: data.from,
      name: data.name,
      avatar: data.avatar,
    });
  });

  socket.on('answerCall', (data) => {
    socket.in(data.to).emit('callAccepted', data.signal);
  });

  socket.on('iceCandidate', (data) => {
    socket.in(data.to).emit('iceCandidate', data.candidate);
  });

  socket.on('endCall', (data) => {
    socket.in(data.to).emit('callEnded');
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
