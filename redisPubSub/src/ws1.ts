import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import { uuid } from 'uuidv4';
interface ChatClient extends WebSocket {
    userId?: string;
}
interface Message {
    type: 'connection' | 'system' | 'chat';
    userId: string;
    message: string;
}


export function startWs1() {
    console.log('Starting WebSocket server 1...');


    const app = express();
    const httpServer = app.listen(8081);

    const wss = new WebSocketServer({ server: httpServer });

    wss.on('connection', async function connection(ws: ChatClient) {

    ws.send("Server Connected at 8081")

    

        const userId = uuid();
        ws.userId = userId;

          const welcomeMessage: Message = { 
            type: 'connection', 
            userId: userId, 
            message: `Connected as User ${userId}` 
        };
        ws.send(JSON.stringify(welcomeMessage));

        const joinMessage: Message = { 
            type: 'system', 
            userId: userId, 
            message: `User ${userId} has joined the chat` 
        };

        broadcastMessage(wss,joinMessage);

        
        ws.on('error', console.error);

        ws.on('message', async function message(data) {

            const parsedData = JSON.parse(data.toString());
            const outgoingMessage = {
                type: 'chat',
                userId: ws.userId,
                message: parsedData.content
            };
            broadcastMessage(wss, outgoingMessage);

      
        });
        ws.on('close', async function close() {
            console.log(` disconnected from 8081`);
        });

        function broadcastMessage(wss:WebSocketServer,message:any){

            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(message));
                }
            })
            
        }
    });

}
