import { Phone, PhoneMissed, Video, RefreshCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCallStore } from "@/stores/useCallStore";
import type { CallMessageInfo, Participant } from "@/types/chat";

interface CallMessageBubbleProps {
  call: CallMessageInfo;
  isOwn: boolean;
  conversationId: string;
  // người còn lại trong đoạn chat (để phục vụ nút "Gọi lại")
  otherUser: Participant | null;
}

const formatCallDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} giây`;
  return `${m} phút ${s} giây`;
};

const CallMessageBubble = ({ call, isOwn, conversationId, otherUser }: CallMessageBubbleProps) => {
  const startCall = useCallStore((s) => s.startCall);

  const isVideo = call.callType === "video";

  // label + icon theo status, có phân biệt góc nhìn của người xem
  // (vd: rejected - bên gọi thấy "bị từ chối", bên nhận thấy "đã từ chối")
  const getLabel = () => {
    switch (call.status) {
      case "completed":
        return isOwn ? "Cuộc gọi đi" : "Cuộc gọi đến";
      case "missed":
        return isOwn ? "Không có ai bắt máy" : "Cuộc gọi nhỡ";
      case "rejected":
        return isOwn ? "Cuộc gọi bị từ chối" : "Bạn đã từ chối";
      case "cancelled":
        return isOwn ? "Bạn đã huỷ cuộc gọi" : "Cuộc gọi bị huỷ";
      default:
        return "Cuộc gọi";
    }
  };

  const isMissedLike = call.status === "missed" || call.status === "rejected" || call.status === "cancelled";

  const Icon = isMissedLike ? PhoneMissed : isVideo ? Video : Phone;

  const handleCallBack = () => {
    if (!otherUser) return;
    startCall(conversationId, otherUser._id, call.callType, {
      _id: otherUser._id,
      displayName: otherUser.displayName,
      avatarUrl: otherUser.avatarUrl,
    });
  };

  return (
    <Card className={cn("p-3 gap-2 border-none glass min-w-[200px]", isOwn && "ml-auto")}>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex items-center justify-center h-8 w-8 rounded-full shrink-0",
            isMissedLike ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"
          )}
        >
          <Icon className="size-4" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{getLabel()}</p>
          {call.status === "completed" && (
            <p className="text-xs text-muted-foreground">{formatCallDuration(call.duration)}</p>
          )}
        </div>
      </div>

      {otherUser && (
        <button
          onClick={handleCallBack}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline w-fit"
        >
          <RefreshCcw className="size-3" />
          Gọi lại
        </button>
      )}
    </Card>
  );
};

export default CallMessageBubble;