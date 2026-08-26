import type { Socket } from 'socket.io-client';
import type { Conversation, Message } from './chat';
import { type Friend, type FriendRequest, type User } from './user'
import type { CallerInfo, CallType, CallUIState, IncomingCall } from './call'

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
    // dùng khi nhận 1 conversation hoàn toàn mới qua socket (vd: người khác
    // vừa nhắn tin lần đầu) - khác addConvo ở chỗ KHÔNG tự set activeConversationId,
    // vì người nhận đang bị động, không nên tự bị chuyển màn hình
    addNewConversation: (convo: Conversation) => void;
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

export interface CallStoreState {
    callState: CallUIState;
    incomingCall: IncomingCall | null;
    otherUser: CallerInfo | null;
    callType: CallType | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isMuted: boolean;
    isCameraOff: boolean;
    error: string | null;

    startCall: (conversationId: string, calleeId: string, type: CallType, calleeInfo: CallerInfo) => void;
    cancelCall: () => void;
    acceptCall: () => Promise<void>;
    rejectCall: () => void;
    endCall: () => void;
    toggleMute: () => void;
    toggleCamera: () => void;
    _cleanup: () => void;

    // nội bộ - được useSocketStore gọi khi nhận event từ server
    _handleRinging: (payload: { callId: string }) => void;
    _handleIncoming: (payload: IncomingCall) => void;
    _handleAccepted: (payload: { callId: string }) => Promise<void>;
    _handleOffer: (payload: { callId: string; from: string; sdp: RTCSessionDescriptionInit }) => Promise<void>;
    _handleAnswer: (payload: { sdp: RTCSessionDescriptionInit }) => Promise<void>;
    _handleIceCandidate: (payload: { candidate: RTCIceCandidateInit }) => void;
    _handleRejected: () => void;
    _handleCancelled: () => void;
    _handleEnded: () => void;
    _handleTimeout: () => void;
    _handleBusy: () => void;
    _handleUnavailable: () => void;
    _handleCallError: (payload: { message: string }) => void;
}