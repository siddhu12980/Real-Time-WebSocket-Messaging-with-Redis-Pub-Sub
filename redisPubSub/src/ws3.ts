import express from 'express';
import { WebSocketServer } from 'ws';
import { redisPubSubManager } from './pub';  // Assuming this is the RedisPubSubManager

const app = express();
const httpServer = app.listen(8083);

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', async function connection(ws) {
    const userId = "user3"; 
    const roomId = "room1"; 

    console.log(`User ${userId} connected and subscribing to room ${roomId}...`);

    // Subscribe the user to the room via Redis
    await redisPubSubManager.subscribeUser(userId, roomId);

    ws.on('error', console.error);

    ws.on('message', async function message(data) {
        try {
            const { recipient, content } = JSON.parse(data.toString());
            const delivery = { sender: userId, recipient, content };

            console.log(`User ${userId} sending message to room`);
            await redisPubSubManager.sendMessage(roomId, { ...delivery});

        } catch (err) {
            console.error('Error processing message:', err);
        }
    });

    // Listen for Redis messages for this user and forward them to the WebSocket client
    redisPubSubManager.listenForMessages(roomId, (message) => {
        console.log(`Forwarding Redis message to  ${userId}: ${message}`);
        ws.send(message);
    });

    ws.on('close', async function close() {
        console.log(`User ${userId} disconnected from room ${roomId}`);
        await redisPubSubManager.unsubscribeUser(userId, roomId); 
        await redisPubSubManager.disconnect();
    });
});
