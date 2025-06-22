//23af-213-147-164-210.ngrok-free.app
// utils/ws.ts

export function connectWebSocket(url: string, onMessage: (data: any) => void) {
    const ws = new WebSocket(url);
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onMessage(data);
    };
    return ws;
}
