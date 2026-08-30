import { create } from "zustand";
import { toast } from "sonner";
import { useSocketStore } from "./useSocketStore";
import type { CallStoreState } from "@/types/store";
import type { CallType, IncomingCall } from "@/types/call";
import { playRingback, stopRingback, playRingtone, stopRingtone } from "@/lib/sounds";

// STUN free của Google - chỉ giúp tìm địa chỉ public, KHÔNG giúp truyền
// được media nếu 1 trong 2 bên ở sau NAT đối xứng (4G, mạng công ty...).
// Nếu console log ra "iceConnectionState: failed", đây chính là nguyên nhân
// -> cần thêm TURN server thật (self-host coturn hoặc dịch vụ trả phí).
// Dưới đây là TURN test free của Open Relay Project - CHỈ dùng để debug/demo,
// không dùng cho production (giới hạn băng thông, không cam kết uptime).
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
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
    onRemoteStream(event.streams[0]);

    if (event.track.kind === "video") {
      useCallStore.setState({ remoteVideoEnabled: true });
    }
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
  remoteVideoEnabled: false,
  error: null,

  // ---- gọi đi ----
  startCall: (conversationId, calleeId, type, calleeInfo) => {
    const socket = getSocket();
    if (!socket) return;

    remoteUserId = calleeId;
    set({ callState: "outgoing", callType: type, otherUser: calleeInfo, error: null });
    socket.emit("call:invite", { conversationId, calleeId, type });
    playRingback(); 
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

    stopRingback();

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
    const newEnabled = isCameraOff; // giá trị track.enabled SẮP được set (đảo ngược trạng thái hiện tại)

    localStream?.getVideoTracks().forEach((track) => (track.enabled = newEnabled));
    set({ isCameraOff: !isCameraOff });

    // báo cho đối phương biết mình vừa bật/tắt cam - KHÔNG dựa vào
    // track mute/unmute vì set track.enabled=false không làm track bên
    // nhận bắn sự kiện đó (theo spec, chỉ gửi black frame, không mute)
    if (currentCallId && remoteUserId) {
      getSocket()?.emit("call:video-toggle", {
        callId: currentCallId,
        to: remoteUserId,
        enabled: newEnabled,
      });
    }
  },

  _cleanup: () => {
    stopRingback();
    stopRingtone()

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
      remoteVideoEnabled: false,
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
    playRingtone();
  },

  _handleAccepted: async () => {
    const socket = getSocket();
    if (!socket || !remoteUserId || !currentCallId) return;

    stopRingtone();

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

  _handleVideoToggle: ({ enabled }) => {
    set({ remoteVideoEnabled: enabled });
},
}));