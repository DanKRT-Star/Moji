import {create} from 'zustand';
import {io, type Socket} from 'socket.io-client';
import { useAuthStore } from './useAuthStore';
import type { SocketState } from '@/types/store';
import { useChatStore } from './useChatStore';
import { useCallStore } from './useCallStore';
import { playMessageSound, playSendMessageSound } from "@/lib/sounds";

const baseUrl = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set,get) => ({
    socket: null,
    onlineUsers: [],
    connectSocket: () => {
        const accessToken = useAuthStore.getState().accessToken;
        const existingSocket = get().socket;

        if(existingSocket) return;

        const socket: Socket = io(baseUrl, {
            auth: {token: accessToken},
            transports: ["websocket"]
        });

        set({socket});

        socket.on("connect", () => {
            console.log("Đã kết nối với socket")
        });

        //public users
        socket.on("online-users", (userIds) => {
            set({onlineUsers: userIds});
        });

        //new message
        socket.on("new-message", ({message, conversation, unreadCounts}) => {
                useChatStore.getState().addMessage(message);

                const currentUserId = useAuthStore.getState().user?._id;
                if (message.senderId === currentUserId) {
                    playSendMessageSound(); 
                } else {
                    playMessageSound();
                }

                const lastMessage = {
                    _id: conversation.lastMessage._id,
                    content: conversation.lastMessage.content,
                    createdAt: conversation.lastMessage.createdAt,
                    sender: {
                        _id: conversation.lastMessage.senderId,
                        displayName: "",
                        avatarUrl: null
                    }
                };
            
                const updatedConversation = {
                    ...conversation,
                    lastMessage,
                    unreadCounts
                }
        
            const conversationExists = useChatStore.getState().conversations.some(
                (c) => c._id === conversation._id
            );
        
            if (!conversationExists) {
                // conversation hoàn toàn mới (lần đầu người khác nhắn tin cho mình)
                // -> thêm vào sidebar, KHÔNG tự chuyển active conversation
                useChatStore.getState().addNewConversation(updatedConversation);
                return;
            }
        
            if(useChatStore.getState().activeConversationId === message.conversationId) {
                useChatStore.getState().markAsSeen();
            }
        
            useChatStore.getState().updateConversation(updatedConversation);
        });

        //read message
        socket.on("read-message", ({conversation, lastMessage}) => {
            const updated = {
                ...conversation,
                lastMessage
            };
            useChatStore.getState().updateConversation(updated);
        });

        //new group chat
        socket.on('new-group', (conversation) => {
            useChatStore.getState().addConvo(conversation);
            socket.emit('join-conversation', conversation._id)
        })

        socket.on("call:ringing", useCallStore.getState()._handleRinging);
        socket.on("call:incoming", useCallStore.getState()._handleIncoming);
        socket.on("call:accepted", useCallStore.getState()._handleAccepted);
        socket.on("call:offer", useCallStore.getState()._handleOffer);
        socket.on("call:answer", useCallStore.getState()._handleAnswer);
        socket.on("call:ice-candidate", useCallStore.getState()._handleIceCandidate);
        socket.on("call:rejected", useCallStore.getState()._handleRejected);
        socket.on("call:cancelled", useCallStore.getState()._handleCancelled);
        socket.on("call:ended", useCallStore.getState()._handleEnded);
        socket.on("call:timeout", useCallStore.getState()._handleTimeout);
        socket.on("call:busy", useCallStore.getState()._handleBusy);
        socket.on("call:unavailable", useCallStore.getState()._handleUnavailable);
        socket.on("call:error", useCallStore.getState()._handleCallError);
        socket.on("call:video-toggle", useCallStore.getState()._handleVideoToggle);
    },
    disconnectSocket: () => {
        const socket = get().socket;
        if(socket) {
            useCallStore.getState()._cleanup();
            socket.disconnect();
            set({socket: null});
        }
    }
})) 