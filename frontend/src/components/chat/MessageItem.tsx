import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat"
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { useAuthStore } from "@/stores/useAuthStore";
import CallMessageBubble from "./CallMessageBubble";


interface MessageItemProps {
    message: Message;
    index: number;
    messages: Message[];
    selectedConvo: Conversation;
    lastMessageStatus: "delivered" | "seen"
}

const MessageItem = ({
    message, 
    index, 
    messages, 
    selectedConvo, 
    lastMessageStatus} : MessageItemProps
) => {
    const prev = index + 1 < messages.length ? messages[index + 1] : undefined;

    const isShowTime = index === 0 || 
        new Date(message.createdAt).getTime() - new Date(prev?.createdAt || 0).getTime() > 300000;  

    const isGroupBreak = isShowTime || 
        message.senderId !== prev?.senderId;

    const participant = selectedConvo.participants.find((p: Participant) => p._id.toString() === message.senderId.toString());

    // người còn lại trong đoạn chat 1-1 (dùng cho nút "Gọi lại" ở tin nhắn
    // dạng call) - tính năng gọi hiện chỉ hỗ trợ chat direct nên lấy
    // participant khác user hiện tại là đủ, không cần lo trường hợp nhóm
    const { user } = useAuthStore();
    const otherUser = selectedConvo.participants.find(
        (p: Participant) => p._id.toString() !== user?._id?.toString()
    ) ?? null;
    
    
    return (
        <>
            <div 
                className={cn(
                    "flex gap-2 message-bounce mt-1", 
                    message.isOwn ? "justify-end" : "justify-start"
                )}
            >
                {/* avatar */}
                {!message.isOwn && (
                    <div className="w-8">
                        {isGroupBreak && (
                            <UserAvatar
                                type="chat"
                                name={participant?.displayName ?? "Moji"}
                                avatarUrl={participant?.avatarUrl ?? undefined}
                            />
                        )}
                    </div>
                )}

                {/* tin nhắn */}
                <div
                    className={cn("max-w-xs lg:max-w-md space-y-1 flex flex-col",
                        message.isOwn ? "items-end" : "items-start"
                    )}
                >
                    {message.type === "call" && message.call ? (
                        <CallMessageBubble
                            call={message.call}
                            isOwn={!!message.isOwn}
                            conversationId={selectedConvo._id}
                            otherUser={otherUser}
                        />
                    ) : message.imgUrl ? (
                        <Card
                            className={cn(
                                "p-1.5 gap-1.5 overflow-hidden border-0",
                                message.isOwn ? "bg-chat-bubble-sent text-white" : "bg-chat-bubble-received"
                            )}
                        >
                            <img
                                src={message.imgUrl}
                                alt="Hình ảnh"
                                loading="lazy"
                                className="rounded-lg max-w-[260px] max-h-80 w-full object-cover cursor-pointer"
                                onClick={() => window.open(message.imgUrl!, "_blank")}
                            />
                            {message.content && (
                                <p className="text-sm leading-relaxed wrap-break-word px-1.5 pb-0.5">
                                    {message.content}
                                </p>
                            )}
                        </Card>
                    ) : (
                        <Card className={cn("p-3", message.isOwn ? "bg-chat-bubble-sent text-white border-0" : "bg-chat-bubble-received")}>
                            <p className="text-sm leading-relaxed wrap-break-word">{message.content}</p>
                        </Card>
                    )}

                    {/* seen / delivered */}
                    {message.isOwn && message._id === selectedConvo.lastMessage?._id && (
                        <Badge
                            variant='outline'
                            className={cn("text-xs px-1.5 py-0.5 h-4 border-0", 
                                lastMessageStatus === 'seen' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                            )}
                        >
                            {lastMessageStatus}
                        </Badge>
                    )}
                </div>
            </div>

            {/* timestamp */}
            {isShowTime && (
                <span className="text-xs text-center text-muted-foreground px-1 py-2">
                    {formatMessageTime(new Date(message.createdAt))}
                </span>
            )}
        </>
    )
}

export default MessageItem