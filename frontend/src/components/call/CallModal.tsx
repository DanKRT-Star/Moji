import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCallStore } from "@/stores/useCallStore";

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const CallTimer = () => {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return <>{formatDuration(duration)}</>;
};

const CallModal = () => {
  const {
    callState,
    otherUser,
    callType,
    localStream,
    remoteStream,
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

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const isVideoCall = callType === "video";

  return (
    <Dialog open={callState !== "idle"}>
      <DialogContent
        className="sm:max-w-md p-0 gap-0 overflow-hidden border-none [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">
          {callState === "incoming" && "Cuộc gọi đến"}
          {callState === "outgoing" && "Đang gọi"}
          {callState === "ongoing" && "Đang trong cuộc gọi"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Giao diện {isVideoCall ? "gọi video" : "gọi thoại"} với {otherUser?.displayName ?? "người dùng"}
        </DialogDescription>

        <div className="relative flex flex-col items-center justify-between bg-gradient-purple min-h-[420px]">
          {callState === "ongoing" && remoteStream && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={
                isVideoCall
                  ? "absolute inset-0 h-full w-full object-cover"
                  : "hidden"
              }
            />
          )}

          {callState === "ongoing" && isVideoCall && localStream && !isCameraOff && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute top-4 right-4 w-24 h-32 rounded-lg object-cover border border-white/20 shadow-lg"
            />
          )}

          <div className="relative z-10 flex flex-col items-center gap-3 pt-12">
            <Avatar className="h-24 w-24 border-2 border-white/30">
              <AvatarImage src={otherUser?.avatarUrl ?? undefined} />
              <AvatarFallback className="text-2xl">
                {otherUser?.displayName?.[0] ?? "?"}
              </AvatarFallback>
            </Avatar>

            <div className="text-center">
              <p className="text-lg font-semibold">{otherUser?.displayName ?? "Đang kết nối..."}</p>
              <p className="text-sm">
                {callState === "outgoing" && "Đang gọi..."}
                {callState === "incoming" &&
                  (isVideoCall ? "Cuộc gọi video đến" : "Cuộc gọi thoại đến")}
                {callState === "ongoing" && <CallTimer />}
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-4 pb-10">
            {callState === "incoming" && (
              <>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-14 w-14 rounded-full"
                  onClick={rejectCall}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
                <Button
                  size="icon"
                  className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600"
                  onClick={acceptCall}
                >
                  <Phone className="h-6 w-6" />
                </Button>
              </>
            )}

            {callState === "outgoing" && (
              <Button
                size="icon"
                variant="destructive"
                className="h-14 w-14 rounded-full"
                onClick={cancelCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            )}

            {callState === "ongoing" && (
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-12 w-12 rounded-full"
                  onClick={toggleMute}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>

                {isVideoCall && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-12 w-12 rounded-full"
                    onClick={toggleCamera}
                  >
                    {isCameraOff ? (
                      <VideoOff className="h-5 w-5" />
                    ) : (
                      <Video className="h-5 w-5" />
                    )}
                  </Button>
                )}

                <Button
                  size="icon"
                  variant="destructive"
                  className="h-14 w-14 rounded-full"
                  onClick={endCall}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CallModal;