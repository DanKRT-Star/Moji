export interface Participant {
  _id: string;
  displayName: string;
  avatarUrl?: string | null;
  joinedAt: string;
}

export interface SeenUser {
  _id: string;
  displayName?: string;
  avatarUrl?: string | null;
}

export interface Group {
  name: string;
  createdBy: string;
}

export interface LastMessage {
  _id: string;
  content: string;
  createdAt: string;
  sender: {
    _id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  group?: Group;
  participants: Participant[];
  lastMessageAt: string;
  seenBy: SeenUser[];
  lastMessage: LastMessage | null;
  unreadCounts: Record<string, number>; 
  createdAt: string;
  updatedAt: string;
}

export interface ConversationResponse {
  conversations: Conversation[];
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  type: "text" | "call";
  content: string | null;
  imgUrl?: string | null;
  call?: CallMessageInfo | null;
  updatedAt?: string | null;
  createdAt: string;
  isOwn?: boolean;
}

export interface CallMessageInfo {
  callId: string;
  callerId: string;
  calleeId: string;
  callType: "audio" | "video";
  status: "completed" | "missed" | "rejected" | "cancelled";
  duration: number;
}
