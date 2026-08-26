export type CallType = "audio" | "video";

export type CallUIState = "idle" | "outgoing" | "incoming" | "ongoing";

export type CallStatus =
  | "ringing"
  | "ongoing"
  | "completed"
  | "missed"
  | "rejected"
  | "cancelled";

export interface Call {
  _id: string;
  conversationId: string;
  callerId: CallerInfo;
  calleeId: CallerInfo;
  type: CallType;
  status: CallStatus;
  startedAt: string | null;
  endedAt: string | null;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

export interface CallerInfo {
  _id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface IncomingCall {
  callId: string;
  conversationId: string;
  type: CallType;
  caller: CallerInfo;
}