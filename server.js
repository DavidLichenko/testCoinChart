import { createServer } from 'http';
import { Server } from 'socket.io';

const server = createServer();
const io = new Server(server, {
  cors: {
    origin: [
      "https://www.aragon-trade.com",
      "https://aragon-trade.com",
      "http://www.aragon-trade.com",
      "http://aragon-trade.com",
      "http://localhost:3000",          // Localhost
      "http://80.137.37.62:3000",  // Your public IP address
      "http://2003:e9:ff05:d828:509e:edce:f5e1:73e5:3000",
    ],
    methods: ["GET", "POST"],
  },
});

const userSockets = {}; // Store user connections by their user ID
let supportSocket = null; // Store the support agent's socket (single support)

// Handle new socket connections
io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Register user socket when they connect
  socket.on('register', (userId) => {
    userSockets[userId] = socket;
    console.log(`User ${userId} connected`);

    // If the support agent connects, store their socket
    if (userId === 'support') {  // Assuming 'support' is a unique identifier for support agents
      supportSocket = socket;
      console.log('Support agent connected');
    }
  });

  // Handle message from user to support
  socket.on('chat message', (messageData) => {
    const { userId, content, isSupportMessage } = messageData;
    console.log(`Received message from user ${userId}:`, content);

    // Send message to support agent if they're connected
    if (supportSocket) {
      supportSocket.emit('chat message', messageData);
    } else {
      console.log('Support agent not connected');
    }
  });

  // Handle support agent response to user
  socket.on('support message', (messageData) => {
    const { userId, content, isSupportMessage } = messageData;
    console.log(`Support message to user ${userId}:`, content);

    // Find the user socket and send the message to the specific user
    const userSocket = userSockets[userId];
    if (userSocket) {
      userSocket.emit('chat message', messageData);
    } else {
      console.log(`User ${userId} not connected`);
    }
  });

  // Handle socket disconnections
  socket.on('disconnect', () => {
    console.log('A user disconnected');

    // If a user or support agent disconnects, remove them from the registry
    for (let userId in userSockets) {
      if (userSockets[userId] === socket) {
        delete userSockets[userId];
        break;
      }
    }

    // If the support agent disconnects, clear supportSocket
    if (supportSocket === socket) {
      supportSocket = null;
      console.log('Support agent disconnected');
    }
  });
});

server.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
