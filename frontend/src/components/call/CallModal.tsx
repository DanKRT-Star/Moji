import { useEffect, useRef, useState } from "react";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCallStore } from "@/stores/useCallStore";

const WINDOWED_WIDTH = 320;
const WINDOWED_HEIGHT = 400;
const WINDOWED_MARGIN = 24;

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const CallTimer = ({ compact }: { compact: boolean }) => {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <span className="px-2 py-1 rounded-full bg-black/40 text-xs font-medium backdrop-blur-sm">
        {formatDuration(duration)}
      </span>
    );
  }

  return <>{formatDuration(duration)}</>;
};

const CallModal = () => {
  const {
    callState,
    otherUser,
    callType,
    localStream,
    remoteStream,
    remoteVideoEnabled,
    isMuted,
    isCameraOff,
    acceptCall,
    rejectCall,
    cancelCall,
    endCall,
    toggleMute,
    toggleCamera,
  } = useCallStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(true);
  const [position, setPosition] = useState(() => ({
    x: Math.max(0, window.innerWidth - WINDOWED_WIDTH - WINDOWED_MARGIN),
    y: Math.max(0, window.innerHeight - WINDOWED_HEIGHT - WINDOWED_MARGIN),
  }));
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [prevCallState, setPrevCallState] = useState(callState);
  if (callState !== prevCallState) {
    setPrevCallState(callState);
    if (callState === "outgoing" || callState === "incoming") {
      setIsFullscreen(true);
    }
  }

  const handleDragStart = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;

    setDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    if (!dragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const maxX = window.innerWidth - WINDOWED_WIDTH;
      const maxY = window.innerHeight - WINDOWED_HEIGHT;

      setPosition({
        x: Math.min(Math.max(0, e.clientX - dragOffset.current.x), Math.max(0, maxX)),
        y: Math.min(Math.max(0, e.clientY - dragOffset.current.y), Math.max(0, maxY)),
      });
    };

    const handlePointerUp = () => setDragging(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragging]);

  useEffect(() => {
    const el = localVideoRef.current;
    if (!el) return;
    el.srcObject = localStream;
    if (localStream) {
      el.play().catch((err) => console.error("[call] local play() lỗi:", err));
    }
  }, [localStream]);

  useEffect(() => {
    const el = remoteVideoRef.current;
    if (!el) return;
    el.srcObject = remoteStream;
    if (remoteStream) {
      el.play().catch((err) => console.error("[call] remote play() lỗi:", err));
    }
  }, [remoteStream]);

  if (callState === "idle") return null;

  const isVideoCall = callType === "video";
  const showRemoteFace = callState === "ongoing" && isVideoCall && remoteVideoEnabled;
  const showLocalPreview =
    callState === "ongoing" && isVideoCall && !!localStream && !isCameraOff;

  const callContent = (
    <div className="relative flex flex-col items-center justify-between w-full h-full bg-gradient-purple text-white overflow-hidden">
      {/* nút thu nhỏ / phóng to */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsFullscreen((v) => !v);
        }}
        className="absolute top-4 right-4 z-30 flex items-center justify-center h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>

      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={
          showRemoteFace
            ? "absolute inset-0 h-full w-full object-cover"
            : "absolute w-px h-px opacity-0 pointer-events-none"
        }
      />

      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className={
          showLocalPreview
            ? "absolute top-4 right-16 w-20 h-28 rounded-lg object-cover border border-white/20 shadow-lg z-20"
            : "absolute w-px h-px opacity-0 pointer-events-none"
        }
      />

      {callState === "ongoing" && showRemoteFace && (
        <div className="absolute top-4 left-4 z-20">
          <CallTimer compact />
        </div>
      )}

      {!showRemoteFace && (
        <div className="relative z-10 flex flex-col items-center gap-3 pt-12">
          <Avatar className="h-24 w-24 border-2 border-white/30">
            <AvatarImage src={otherUser?.avatarUrl ?? undefined} />
            <AvatarFallback className="text-2xl">
              {otherUser?.displayName?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>

          <div className="text-center">
            <p className="text-lg font-semibold">{otherUser?.displayName ?? "Đang kết nối..."}</p>
            <p className="text-sm text-white/70">
              {callState === "outgoing" && "Đang gọi..."}
              {callState === "incoming" &&
                (isVideoCall ? "Cuộc gọi video đến" : "Cuộc gọi thoại đến")}
              {callState === "ongoing" && !showRemoteFace && <CallTimer compact={false} />}
            </p>
          </div>
        </div>
      )}

      {/* nút điều khiển */}
      <div className="relative z-10 mt-auto flex items-center gap-4 pb-10">
        {callState === "incoming" && (
          <>
            <Button size="icon" variant="destructive" className="h-14 w-14 rounded-full" onClick={rejectCall}>
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button size="icon" className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600" onClick={acceptCall}>
              <Phone className="h-6 w-6" />
            </Button>
          </>
        )}

        {callState === "outgoing" && (
          <Button size="icon" variant="destructive" className="h-14 w-14 rounded-full" onClick={cancelCall}>
            <PhoneOff className="h-6 w-6" />
          </Button>
        )}

        {callState === "ongoing" && (
          <>
            <Button size="icon" variant="secondary" className="h-14 w-14 rounded-full" onClick={toggleMute}>
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            {isVideoCall && (
              <Button size="icon" variant="secondary" className="h-14 w-14 rounded-full" onClick={toggleCamera}>
                {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </Button>
            )}

            <Button size="icon" variant="destructive" className="h-14 w-14 rounded-full" onClick={endCall}>
              <PhoneOff className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>
    </div>
  );

  if (isFullscreen) {
    return <div className="fixed inset-0 z-50">{callContent}</div>;
  }

  return (
    <div
      onPointerDown={handleDragStart}
      style={{
        left: position.x,
        top: position.y,
        width: WINDOWED_WIDTH,
        height: WINDOWED_HEIGHT,
      }}
      className={
        "fixed z-50 rounded-xl overflow-hidden shadow-2xl select-none touch-none " +
        (dragging ? "cursor-grabbing" : "cursor-grab")
      }
    >
      {callContent}
    </div>
  );
};

export default CallModal;