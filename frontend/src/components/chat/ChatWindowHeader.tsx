import { useChatStore } from "@/stores/useChatStore"
import type { Conversation, Participant } from "@/types/chat"
import { SidebarTrigger } from "../ui/sidebar";
import { useAuthStore } from "@/stores/useAuthStore";
import { Separator } from "../ui/separator";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import GroupChatAvatar from "./GroupChatAvatar";
import { useSocketStore } from "@/stores/useSocketStore";
import { useCallStore } from "@/stores/useCallStore";
import { Button } from "../ui/button";
import { Phone, Video } from "lucide-react";
import { toast } from "sonner";

const ChatWindowHeader = ({chat} : {chat? : Conversation}) => {
  const {conversations, activeConversationId} = useChatStore();
  const {user} = useAuthStore();
  const {onlineUsers} = useSocketStore();
  const {callState, startCall} = useCallStore();
  let otherUser: Participant | null = null;

  chat = chat ?? conversations.find((c) => c._id === activeConversationId);

  if (!chat) {
    return  (
      <header className="md:hidden sticky top-0 z-10 flex items-center gap-2 px-4 py-2 w-full">
        <SidebarTrigger className="-ml-1 text-foreground"/>
      </header>
    )
  };

  if(chat.type === "direct") {
    const otherUsers = chat.participants.filter((p) => p._id !== user?._id);
    otherUser = otherUsers.length > 0 ? otherUsers[0] : null;

    if (!user || !otherUser) return;
  }

  const isOtherUserOnline = chat.type === "direct" && onlineUsers.includes(otherUser?._id ?? "");

  const handleStartCall = (type: "audio" | "video") => {
    if (!chat || chat.type !== "direct" || !otherUser) return;

    if (callState !== "idle") {
      toast.warning("Bạn đang trong 1 cuộc gọi khác");
      return;
    }

    if (!isOtherUserOnline) {
      toast.warning("Người dùng hiện không online");
      return;
    }

    startCall(chat._id, otherUser._id, type, {
      _id: otherUser._id,
      displayName: otherUser.displayName,
      avatarUrl: otherUser.avatarUrl,
    });
  };
  
  return (
    <header className="stiky top-0 z-10 px-4 py-2 flex items-center bg-background">
      <div className="flex items-center gap-2 w-full">
        <SidebarTrigger className="-ml-1 text-foreground"/>
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4" 
        />
        <div className="p-2 w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              {
                chat.type === "direct" ? (
                  <>
                    <UserAvatar
                      type={"sidebar"}
                      name={otherUser?.displayName || "Moji"}
                      avatarUrl={otherUser?.avatarUrl || undefined} 
                    />

                    <StatusBadge status={isOtherUserOnline ? "online" : "offline"}/>
                  </>
                ) : (
                  <GroupChatAvatar
                    participants={chat.participants}
                    type="sidebar"
                  />
                )
              }
            </div>
            <h2 className="font-semibold text-foreground">
              {chat.type === "direct" ? otherUser?.displayName : chat.group?.name}
            </h2>
          </div>

          {chat.type === "direct" && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10 transition-smooth"
                onClick={() => handleStartCall("audio")}
              >
                <Phone className="size-4"/>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10 transition-smooth"
                onClick={() => handleStartCall("video")}
              >
                <Video className="size-4"/>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default ChatWindowHeader