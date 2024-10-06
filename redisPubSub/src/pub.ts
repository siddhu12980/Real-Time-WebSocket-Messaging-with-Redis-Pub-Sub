import { createClient, RedisClientType } from 'redis';

class RedisPubSubManager {
    private static _instance: RedisPubSubManager | null = null;
    private subClient: RedisClientType;
    private pubClient: RedisClientType;

    private constructor() {
        console.log('RedisPubSubManager created');
        this.subClient = createClient();
        this.pubClient = createClient();
    }

    public static getInstance(): RedisPubSubManager {
        if (!RedisPubSubManager._instance) {
            RedisPubSubManager._instance = new RedisPubSubManager();
        }
        return RedisPubSubManager._instance;
    }

    private async ensureRedisConnection() {
        try {
            if (!this.pubClient.isOpen) {
                console.log("Connecting pub client to Redis...");
                await this.pubClient.connect();
            }
            if (!this.subClient.isOpen) {
                console.log("Connecting sub client to Redis...");
                await this.subClient.connect();
            }
        } catch (error) {
            console.error("Failed to connect to Redis:", error);
            throw error;
        }
    }

    subscribeUser = async (userId: string, roomId: string) => {
        await this.ensureRedisConnection();

        await this.subClient.subscribe(roomId, (message) => {
            console.log(`User ${userId} received message: ${message}`);
        });

        await this.subClient.subscribe(userId, (message) => {
            console.log(`User ${userId} received personal message: ${message}`);
        });

        await this.sendMessage(roomId, {
            recipient: 'all',
            content: `User ${userId} has joined the room.`
        });
    }

    unsubscribeUser = async (userId: string, roomId: string) => {
        await this.ensureRedisConnection();

  await this.sendMessage(roomId, {
//      type: "system",
      sender: "server",
      recipient: "all",
      content: `User ${userId} has left the room.`
    });
        await this.subClient.unsubscribe(userId);

        await this.subClient.unsubscribe(roomId);
    }

    sendMessage = async (roomId: string, message: { sender?: string; recipient?: string; content: string; }) => {

        await this.ensureRedisConnection();

        const { recipient } = message;

        if (recipient === 'all') {
            await this.pubClient.publish(roomId, JSON.stringify(message) );
        } else {
            await this.pubClient.publish(recipient ?? '', JSON.stringify(message));
        }
    };


    listenForMessages = async (roomId: string, callback: (message: string) => void) => {

        await this.ensureRedisConnection();

        await this.subClient.subscribe(roomId, (message) => {
            console.log(`Room ${roomId} received message: ${message}`);
            callback(message);
        });
    }

    listenForPersonalMessages = async (userId: string, callback: (message: string) => void) => {
        await this.ensureRedisConnection();

        await this.subClient.subscribe(userId, (message) => {
            console.log(`User ${userId} received personal message: ${message}`);
            callback(message);
        });
    }

    disconnect = async () => {
        console.log('Disconnecting from Redis...');
        if (this.pubClient.isOpen) {
            await this.pubClient.quit();
        }
        if (this.subClient.isOpen) {
            await this.subClient.quit();
        }
        console.log('Disconnected from Redis');
    }
}

export const redisPubSubManager = RedisPubSubManager.getInstance();
