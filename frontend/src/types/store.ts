import type { Socket } from 'socket.io-client';
import type { Conversation, Message } from './chat';
import { type Friend, type FriendRequest, type User } from './user'

export interface AuthState {
    accessToken: string | null;
    user: User | null;
    loading: boolean;
    setAccessToken: (accessToken: string) => void;
    setUser: (user: User) => void;
    clearState: () => void;

    signUp: (
        username: string, 
        password: string, 
        email: string, 
        lastName: string, 
        firstName: string
    ) => Promise<void>

    signIn: (
        username: string, 
        password: string, 
    ) => Promise<void>

    signOut: () => Promise<void>

    fetchMe: () =>  Promise<void>

    refresh: () => Promise<void>
} 

export interface ThemeState {
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (dark: boolean) => void;
}

export interface ChatState {
    conversations: Conversation[];
    messages: Record<
        string,
        {
            items: Message[],
            hasMore: boolean,
            nextCursor?: string | null
        }>,
    activeConversationId: string | null,
    convoLoading: boolean,
    messageLoading: boolean;
    loading: boolean;
    reset: () => void,

    setActiveConversation: (id: string | null) => void,
    fetchConversations: () => Promise<void>,

    fetchMessages: (covnersationId?: string) => Promise<void>

    sendDirectMessage: (
        recipientId: string,
        content: string,
        imgUrl?: string
    ) => Promise<void>;

    sendGroupMessage: (
        conversationId: string,
        content: string,
        imgUrl?: string
    ) => Promise<void>;

    addMessage: (message: Message) => Promise<void>;

    markAsSeen: () => Promise<void>;

    updateConversation: (conversation: Conversation) => void

    addConvo: (convo: Conversation) => void;
    createConversation: (type: "group" | "direct", name: string, memberIds: string[]) => Promise<void>
}

export interface SocketState {
    socket: Socket | null;
    connectSocket: () => void;
    disconnectSocket: () => void;
    onlineUsers: string[];
}

export interface FriendState {
    loading: boolean;
    receivedList: FriendRequest[];
    sentList: FriendRequest[];
    friends: Friend[];
    searchByUsername: (username: string) => Promise<User | null>;
    addFriend: (to: string, message?: string) => Promise<string>;
    getAllFriendRequests: () => Promise<void>;
    acceptRequest: (requestId: string) => Promise<void>;
    declineRequest: (requestId: string) => Promise<void>;
    getFriends: () => Promise<void>;
}

export interface UserState {
    uploadAvatarUrl: (formData: FormData) => Promise<void>
}