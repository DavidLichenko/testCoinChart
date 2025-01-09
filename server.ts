import { createServer } from 'http'
import { Server } from 'socket.io'

// VPS hostname and port where the server will listen for WebSocket connections
const hostname = 'srv677099.hstgr.cloud' // Replace with your VPS IP or domain
const port = 3000

// Create a basic HTTP server
const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('WebSocket server is running.')
})

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all domains (you can restrict this for production)
        methods: ['GET', 'POST'],
    },
})

// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log('A user connected')

    // Listen for 'chat message' events from the client
    socket.on('chat message', (msg) => {
        console.log('Message from client:', msg)
        io.emit('chat message', msg) // Broadcast the message to all connected clients
    })

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected')
    })
})

// Start the server
server.listen(port, () => {
    console.log(`> WebSocket server running on http://${hostname}:${port}`)
})
