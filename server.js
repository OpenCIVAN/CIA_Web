// server.js - Simple but reliable Yjs relay
const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store connected clients by room
const rooms = new Map();

wss.on('connection', (ws, req) => {
  // Extract room name from URL (e.g., /vtk-room)
  const roomName = req.url.slice(1) || 'vtk-room';
  console.log(`✅ Client connected to room: ${roomName}`);
  
  // Create room if it doesn't exist
  if (!rooms.has(roomName)) {
    rooms.set(roomName, new Set());
  }
  
  const room = rooms.get(roomName);
  room.add(ws);
  console.log(`   Total clients in ${roomName}: ${room.size}`);
  
  // Relay all messages to other clients in the same room
  ws.on('message', (message) => {
    // Broadcast to all other clients in this room
    room.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error('   ❌ Failed to relay message:', error.message);
        }
      }
    });
  });
  
  // Handle disconnection
  ws.on('close', () => {
    room.delete(ws);
    console.log(`👋 Client disconnected from ${roomName}`);
    console.log(`   Remaining clients: ${room.size}`);
    
    // Clean up empty rooms
    if (room.size === 0) {
      rooms.delete(roomName);
      console.log(`   Room ${roomName} deleted (empty)`);
    }
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });
});

const PORT = process.env.PORT || 9001;
server.listen(PORT, () => {
  console.log(`🔄 Yjs relay server running on ws://localhost:${PORT}`);
  console.log(`   Ready to relay messages between clients`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.error('   Kill the process using port 8080 or change the port.');
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server gracefully...');
  
  // Close all WebSocket connections
  wss.clients.forEach(client => {
    client.close();
  });
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

console.log('🚀 Starting Yjs relay server...');