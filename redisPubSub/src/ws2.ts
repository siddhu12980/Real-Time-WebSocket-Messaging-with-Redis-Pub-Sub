import express from 'express';
import { WebSocketServer } from 'ws';
import { redisPubSubManager } from './pub'; 

const app = express();
const httpServer = app.listen(8082);

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', async function connection(ws) {
    const userId = "user2"; 
    const roomId = "room1"; 

    console.log(`User ${userId} connected and subscribing to room ${roomId}...`);

    await redisPubSubManager.subscribeUser(userId, roomId);

    ws.on('error', console.error);

    ws.on('message', async function message(data) {
        try {
            const { recipient, content } = JSON.parse(data.toString());
            const delivery = { sender: userId, recipient, content };

            await redisPubSubManager.sendMessage(roomId, { ...delivery});

        } catch (err) {
            console.error('Error processing message:', err);
        }
    });

    redisPubSubManager.listenForMessages(roomId, (message) => {
        console.log(`Forwarding Redis message to user ${userId}: ${message}`);
        ws.send(message);
    });

    ws.on('close', async function close() {
        console.log(`User ${userId} disconnected from room ${roomId}`);
        await redisPubSubManager.unsubscribeUser(userId, roomId); 
        await redisPubSubManager.disconnect();
    });
});
