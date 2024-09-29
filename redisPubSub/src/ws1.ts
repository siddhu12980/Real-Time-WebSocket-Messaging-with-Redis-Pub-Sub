import express from 'express';
import { WebSocketServer } from 'ws';
import { redisPubSubManager } from './pub'; 

const app = express();
const httpServer = app.listen(8081);

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', async function connection(ws) {

    const userId = "user1"; 
    const roomId = "room1";  


    await redisPubSubManager.subscribeUser(userId, roomId);

    ws.on('error', console.error);

    ws.on('message', async function message(data) {
        try {

            const { recipient, content, type } = JSON.parse(data.toString());
            const delivery = { sender: userId, recipient, content,type };

            redisPubSubManager.sendMessage(roomId, { ...delivery});
        } catch (err) {
            console.error('Error processing message:', err);
        }
    });

    // Listen for Redis messages for this user and forward them to the WebSocket client
    redisPubSubManager.listenForMessages(roomId, (message) => {
        console.log(`Forwarding Redis message to user ${userId}: ${message}`);
        const parsedMessage = JSON.parse(message);

        ws.send(JSON.stringify(parsedMessage));
    });

    redisPubSubManager.listenForPersonalMessages(userId, (message) => {
        console.log(`Forwarding personal Redis message to user ${userId}: ${message}`);
        const parsedMessage = JSON.parse(message);
        ws.send(JSON.stringify(parsedMessage));
    }
    );

    ws.on('close', async function close() {
        console.log(`User ${userId} disconnected from room ${roomId}`);
        await redisPubSubManager.unsubscribeUser(userId, roomId);
        await redisPubSubManager.disconnect();
    });
});
