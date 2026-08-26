import {Server} from 'socket.io';
import http from 'http';
import express from 'express';
import { socketAuthMiddleware } from '../middlewares/socketMiddleWare.js';
import { getUserConversationsForSocketIO } from '../controllers/conversationController.js';
import { registerCallHandlers } from '../handlers/callHandler.js';

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true
    }
});

io.use(socketAuthMiddleware);

const onlineUsers = new Map();

io.on("connection", async (socket) => {
    const user = socket.user;

    console.log(`${user.displayName} online với ${socket.id}`);

    onlineUsers.set(user._id.toString(), socket.id);

    io.emit("online-users", Array.from(onlineUsers.keys()));

    const conversationIds  = await getUserConversationsForSocketIO(user._id);
    
    conversationIds.forEach((id) => {
        socket.join(id);
    });

    socket.on("join-conversation", (conversationId) => {
        socket.join(conversationId)
    });

    socket.join(user._id.toString());

    registerCallHandlers(io, socket, onlineUsers);

    socket.on("disconnect", () => {
        onlineUsers.delete(user._id.toString()); 
        io.emit("online-users", Array.from(onlineUsers.keys()));
        console.log(`socket disconnected: ${socket.id}`)
    });
});

export { io, app, server};