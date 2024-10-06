import express from "express";
import { WebSocket, WebSocketServer } from "ws";
import { v4 as uuid } from "uuid";
import { redisPubSubManager } from "./pub";

interface ChatClient extends WebSocket {
  userId?: string;
}

interface Message {
  type: "connection" | "system" | "chat";
  sender: string;
  content: string;
  recipient: string;
}

export function startWebSocketServer(port: number) {
  console.log(`Starting WebSocket server on port ${port}...`);
  const app = express();
  const httpServer = app.listen(port);
  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", async function connection(ws: ChatClient) {
    const userId = uuid();
    ws.userId = userId;
    
    await redisPubSubManager.subscribeUser(userId, "room1");
    
    ws.send(JSON.stringify({
      type: "connection",
      sender: "server",
      recipient: userId,
      content: `Connected to server on port ${port}`
    }));

    const welcomeMessage: Message = {
      type: "connection",
      sender: userId,
      recipient: userId,
      content: `Connected as User ${userId}`
    };
    ws.send(JSON.stringify(welcomeMessage));

    const joinMessage: Message = {
      type: "system",
      recipient: "all",
      sender: userId,
      content: `User ${userId} has joined the chat`
    };
    await redisPubSubManager.sendMessage("room1", joinMessage);

    ws.on("error", console.error);

    ws.on("message", async function message(data) {
      try {
        const parsedData = JSON.parse(data.toString());
        const outgoingMessage: Message = {
          type: "chat",
          sender: ws.userId!,
          recipient: "all",
          content: parsedData.content
        };
        await redisPubSubManager.sendMessage("room1", outgoingMessage);
      } catch (e) {
        console.error("Error while sending data:", e);
      }
    });

    redisPubSubManager.listenForMessages("room1", (message) => {
      ws.send(message);
    });

    redisPubSubManager.listenForPersonalMessages(userId, (message) => {
      ws.send(message);
    });

    ws.on("close", async function close() {
      console.log(`User ${userId} disconnected from port ${port}`);
      await redisPubSubManager.unsubscribeUser(userId, "room1");
    });
  });
}
