import { NextRequest, NextResponse } from 'next/server'
import { Server as SocketServer } from 'socket.io'
import WebSocket from 'ws';


// Ensures that the socket server only initializes once
let io: SocketServer | null = null

// WebSocket connection to Tiingo API
// const tiingoWs = new WebSocket('wss://api.tiingo.com/iex')
var ws = new WebSocket('wss://api.tiingo.com/iex');
var subscribe = {
    'eventName':'subscribe',
    'authorization':'5c5398add0e123606bb40277f4cb66352b386185',
    'eventData': {
        'thresholdLevel': 5
    }
}
ws.on('open', function open() {
    console.log("TIINGO OPEN")
    ws.send(JSON.stringify(subscribe));
});

// Function to initialize the Socket.IO server
function initSocketServer() {
  // Initialize the WebSocket server only once





    if (!io) {
    io = new SocketServer({
      cors: {
        origin: 'http://localhost:3000', // Replace with your actual front-end URL
        methods: ['GET', 'POST'],
      },
    })

    io.on('connection', (socket) => {
      console.log('New client connected')

      // Subscribe to specific symbols
      socket.on('subscribe', (symbols: string[]) => {
        console.log('Subscribing to symbols:', symbols)
        // Send subscription request to Tiingo WebSocket
        // tiingoWs.send(JSON.stringify({
        //   eventName: 'subscribe',
        //   authorization: '5c5398add0e123606bb40277f4cb66352b386185',
        //   eventData: {
        //     thresholdLevel: 5,
        //     tickers: symbols,
        //   }
        // }))
      })
      // tiingoWs.on('open', () => {
      //   console.log('Connected to Tiingo WebSocket');
      //   tiingoWs.send(JSON.stringify({
      //     eventName: 'subscribe',
      //     authorization: '5c5398add0e123606bb40277f4cb66352b386185',
      //     eventData: {
      //       thresholdLevel: 5,
      //       tickers: 'symbols',
      //     }
      //   }))
      // });
      // Listen for messages from Tiingo WebSocket
      // tiingoWs.on('message', (data: WebSocket.Data) => {
      //   const message = JSON.parse(data.toString())
      //   console.log(message)
      //   if (message.messageType === 'A') {
      //     socket.emit('market-data', message) // Send market data to connected client
      //   }
      // })

      // Handle client disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected')
      })
    })
  }
}

// API route handler for market data
export async function GET(req: NextRequest) {
  const res = new NextResponse()

  // Initialize the Socket.IO server
  initSocketServer()

  // Respond to the client
  return res
}
