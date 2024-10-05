# Real-Time WebSocket Messaging with Redis Pub/Sub


```
/app
│
├── /redisPubSub/src
│   ├── index.ts         # Main entry point for the server
│   ├── wsHandler.ts     # WebSocket handling logic
│   ├── pubsubHandler.ts # Redis Pub/Sub logic
│   └── roomManager.ts   # Room management (create/join room)
│
├── /frontendws
│   ├── index.html       # Frontend for connecting to chat rooms
│   ├── app.js           #Frontend ws client logic

```

# Key Components
#### 1. **Room Management**
   -  Endpoints to handle the creation and joining of chat rooms:
     - `/create-room`: Generates a unique room ID.
     - `/join-room/:roomId`: Joins a user to the specified room.
   - Store room details (like connected users) in memory or Redis.

#### 2. **WebSocket Server**
   - WebSocket server that listens for connections.
   - When a user joins a room:
     - Establish a WebSocket connection.
     - Subscribe to the Redis channel associated with the room.
     - Notify other users in the room of the new participant.
   - When a message is received:
     - Publish the message to the room’s Redis channel.

#### 3. **Redis Pub/Sub for Rooms**
   - Each room will have its own Redis channel.
   - When a user sends a message to the room, it is **published** to the corresponding Redis channel.
   - All WebSocket clients in that room (subscribed to the Redis channel) will receive the message in real-time.

#### 4. **Frontend WebSocket Client**
   - Simple frontend that connects to the WebSocket server.
   - After joining a room, the WebSocket client sends messages and listens for incoming messages.
   - Display messages in a chat interface.


## Features

- **WebSocket-based communication**: Real-time message transmission between clients using WebSockets.
- **Redis Pub/Sub integration**: Efficient message distribution and room management via Redis Pub/Sub.
- **Room-based messaging**: Clients can join rooms and send messages to all users in the room.
- **Private messaging**: Direct messages between users.
- **System messages**: Notifications when users join or leave rooms.
- **Infinite loop prevention**: Avoids re-broadcasting messages sent by the same user.

- **Scalable**:  Redis Pub/Sub can manage communication across different instances of your WebSocket server. No need to worry about distributing connections since Redis handles it.
  

### Future Updates

- **Persisting Messages**:   Messages to persist (so users can see the chat history when they join a room), you could store them in a Redis list or a database like MongoDB.
  
- **Authentication**:  Implement user authentication before allowing them to create or join rooms.
