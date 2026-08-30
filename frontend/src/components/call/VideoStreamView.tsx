import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface VideoStreamViewProps {
  stream: MediaStream | null;
  muted?: boolean;
  visible: boolean;
  className?: string;
}

const VideoStreamView = ({ stream, muted = false, visible, className }: VideoStreamViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    el.srcObject = stream;

    if (stream) {
      el.play().catch((err) => console.error("[call] play() lỗi:", err));
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={cn(
        "absolute",
        visible ? className : "w-px h-px opacity-0 pointer-events-none"
      )}
    />
  );
};

export default VideoStreamView;