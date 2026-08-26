import { create } from "zustand";
import { toast } from "sonner";
import { useSocketStore } from "./useSocketStore";
import type { CallStoreState } from "@/types/store";
import type { CallType, IncomingCall } from "@/types/call";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];
let peerConnection: RTCPeerConnection | null = null;
let currentCallId: string | null = null;
let remoteUserId: string | null = null;
let pendingCandidates: RTCIceCandidateInit[] = [];

const getSocket = () => useSocketStore.getState().socket;

const getLocalMedia = async (type: CallType | null) => {
  return navigator.mediaDevices.getUserMedia({
    audio: true,
    video: type === "video",
  });
};

const createPeerConnection = (
  toUserId: string,
  callId: string,
  onRemoteStream: (stream: MediaStream) => void
) => {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      getSocket()?.emit("call:ice-candidate", {
        callId,
        to: toUserId,
        candidate: event.candidate,
      });
    }
  };

  pc.ontrack = (event) => {
    console.log("Nhận track từ đối phương:", event.streams[0]?.getTracks());
    onRemoteStream(event.streams[0]);
  };

  pc.onconnectionstatechange = () => {
    if (["failed", "closed"].includes(pc.connectionState)) {
      useCallStore.getState()._cleanup();
    }
  };

  peerConnection = pc;
  return pc;
};

export const useCallStore = create<CallStoreState>((set, get) => ({
  callState: "idle",
  incomingCall: null,
  otherUser: null,
  callType: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isCameraOff: false,
  error: null,

  // ---- gọi đi ----
  startCall: (conversationId, calleeId, type, calleeInfo) => {
    const socket = getSocket();
    if (!socket) return;

    remoteUserId = calleeId;
    set({ callState: "outgoing", callType: type, otherUser: calleeInfo, error: null });
    socket.emit("call:invite", { conversationId, calleeId, type });
  },

  cancelCall: () => {
    if (currentCallId) {
      getSocket()?.emit("call:cancel", { callId: currentCallId });
    }
    get()._cleanup();
  },

  // ---- nhận cuộc gọi ----
  acceptCall: async () => {
    const { incomingCall } = get();
    const socket = getSocket();
    if (!incomingCall || !socket) return;

    try {
      currentCallId = incomingCall.callId;
      remoteUserId = incomingCall.caller._id;

      const stream = await getLocalMedia(incomingCall.type);
      set({ localStream: stream });

      const pc = createPeerConnection(incomingCall.caller._id, incomingCall.callId, (remoteStream) =>
        set({ remoteStream })
      );
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      socket.emit("call:accept", { callId: incomingCall.callId });
      set({ callState: "ongoing" });
    } catch (error) {
      console.error("Lỗi khi accept call:", error);
      toast.error("Không thể truy cập camera/microphone");
      get()._cleanup();
    }
  },

  rejectCall: () => {
    const { incomingCall } = get();
    if (incomingCall) {
      getSocket()?.emit("call:reject", { callId: incomingCall.callId });
    }
    get()._cleanup();
  },

  endCall: () => {
    if (currentCallId) {
      getSocket()?.emit("call:end", { callId: currentCallId });
    }
    get()._cleanup();
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    localStream?.getAudioTracks().forEach((track) => (track.enabled = isMuted));
    set({ isMuted: !isMuted });
  },

  toggleCamera: () => {
    const { localStream, isCameraOff } = get();
    localStream?.getVideoTracks().forEach((track) => (track.enabled = isCameraOff));
    set({ isCameraOff: !isCameraOff });
  },

  _cleanup: () => {
    peerConnection?.close();
    peerConnection = null;
    currentCallId = null;
    remoteUserId = null;
    pendingCandidates = [];

    get().localStream?.getTracks().forEach((track) => track.stop());

    set({
      callState: "idle",
      incomingCall: null,
      otherUser: null,
      callType: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isCameraOff: false,
    });
  },
  
  _handleRinging: ({ callId }) => {
    currentCallId = callId;
  },

  _handleIncoming: (payload: IncomingCall) => {
    currentCallId = payload.callId;
    set({ incomingCall: payload, otherUser: payload.caller, callType: payload.type, callState: "incoming" });
  },

  _handleAccepted: async () => {
    const socket = getSocket();
    if (!socket || !remoteUserId || !currentCallId) return;

    try {
      const stream = await getLocalMedia(get().callType);
      set({ localStream: stream });

      const pc = createPeerConnection(remoteUserId, currentCallId, (remoteStream) =>
        set({ remoteStream })
      );
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call:offer", { callId: currentCallId, to: remoteUserId, sdp: offer });
      set({ callState: "ongoing" });
    } catch (error) {
      console.error("Lỗi khi tạo offer:", error);
      toast.error("Không thể truy cập camera/microphone");
      get()._cleanup();
    }
  },

  _handleOffer: async ({ from, sdp }) => {
    const socket = getSocket();
    const pc = peerConnection;
    if (!pc || !socket || !currentCallId) return;

    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    pendingCandidates.forEach((c) => pc.addIceCandidate(new RTCIceCandidate(c)));
    pendingCandidates = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("call:answer", { callId: currentCallId, to: from, sdp: answer });
  },

  _handleAnswer: async ({ sdp }) => {
    const pc = peerConnection;
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  },

  _handleIceCandidate: ({ candidate }) => {
    const pc = peerConnection;
    if (pc?.remoteDescription) {
      pc.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      pendingCandidates.push(candidate);
    }
  },

  _handleRejected: () => {
    toast.info("Cuộc gọi bị từ chối");
    get()._cleanup();
  },

  _handleCancelled: () => {
    toast.info("Cuộc gọi đã bị huỷ");
    get()._cleanup();
  },

  _handleEnded: () => {
    get()._cleanup();
  },

  _handleTimeout: () => {
    toast.warning("Không có ai bắt máy");
    get()._cleanup();
  },

  _handleBusy: () => {
    toast.warning("Người dùng đang bận");
    get()._cleanup();
  },

  _handleUnavailable: () => {
    toast.warning("Người dùng hiện không online");
    get()._cleanup();
  },

  _handleCallError: ({ message }) => {
    toast.error(message);
    get()._cleanup();
  },
}));