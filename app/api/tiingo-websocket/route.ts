import { NextResponse } from 'next/server';
import WebSocket from 'ws';

let wsClient: WebSocket | null = null;
let currentTickers: Set<string> = new Set(); // Track the current tickers

// Function to handle WebSocket connection and subscription
const connectWebSocket = () => {
    if (wsClient) {
        console.log('WebSocket is already connected');
        return;
    }

    wsClient = new WebSocket('wss://api.tiingo.com/iex');

    wsClient.on('open', () => {
        console.log('WebSocket connection established');
        // Initially subscribe to default tickers
        subscribeToTickers(['SPY', 'AAPL']);
    });

    wsClient.on('message', (data) => {
        console.log('Received message:', JSON.parse(data));
        // Handle incoming messages (e.g., parsing or sending to client)
    });

    wsClient.on('error', (err) => {
        console.error('WebSocket error:', err);
    });

    wsClient.on('close', () => {
        console.log('WebSocket connection closed');
        wsClient = null;
    });
};

// Function to subscribe to new tickers
const subscribeToTickers = (tickers: string[]) => {
    if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not open');
        return;
    }

    const subscribeMessage = {
        eventName: 'subscribe',
        authorization: '5c5398add0e123606bb40277f4cb66352b386185', // Tiingo API key
        eventData: {
            thresholdLevel: 6,
            tickers,
        },
    };

    wsClient.send(JSON.stringify(subscribeMessage));
    console.log('Subscribed to tickers:', tickers);
    tickers.forEach((ticker) => currentTickers.add(ticker)); // Add to current tickers set
};

// Function to unsubscribe from tickers
const unsubscribeFromTickers = (tickers: string[]) => {
    if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not open');
        return;
    }

    const unsubscribeMessage = {
        eventName: 'unsubscribe',
        authorization: '5c5398add0e123606bb40277f4cb66352b386185', // Tiingo API key
        eventData: {
            tickers,
        },
    };

    wsClient.send(JSON.stringify(unsubscribeMessage));
    console.log('Unsubscribed from tickers:', tickers);
    tickers.forEach((ticker) => currentTickers.delete(ticker)); // Remove from current tickers set
};

// Function to handle the subscription logic based on the request
const handleSubscription = (newTickers: string[]) => {
    // Determine which tickers need to be unsubscribed
    const tickersToUnsubscribe = [...currentTickers].filter((ticker) => !newTickers.includes(ticker));

    if (tickersToUnsubscribe.length > 0) {
        unsubscribeFromTickers(tickersToUnsubscribe); // Unsubscribe from tickers that are no longer needed
    }

    // Subscribe to the new tickers
    subscribeToTickers(newTickers);
};

export async function GET(request: Request) {
    const url = new URL(request.url);
    const tickersParam = url.searchParams.get('tickers');
    const newTickers = tickersParam ? tickersParam.split(',') : ['SPY', 'AAPL'];

    // Connect to WebSocket if not already connected
    connectWebSocket();

    // Handle the subscription or update based on the new tickers
    handleSubscription(newTickers);

    return NextResponse.json({
        message: 'WebSocket connection established and subscription updated.',
        tickers: newTickers,
    });
}
