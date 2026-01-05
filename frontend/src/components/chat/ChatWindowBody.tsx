import { useChatStore } from "@/stores/useChatStore"
import ChatWelcomeSceen from "./ChatWelcomeSceen";
import MessageItem from "./MessageItem";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";


const ChatWindowBody = () => {
  const {activeConversationId, conversations, messages: allMessages, fetchMessages} = useChatStore();
  const [lastMessageStatus, setLastMessageStatus] = useState<"delivered" | "seen">("delivered");

  const messages = allMessages[activeConversationId!]?.items ?? [];
  const selectedConvo = conversations.find((c) => c._id === activeConversationId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  


  const hasMore = allMessages[activeConversationId!]?.hasMore ?? false;
  const reverseMessages = [...messages].reverse();

  const key = `chat-scroll-${activeConversationId}`;

  useEffect(() => {
    const lastMessage = selectedConvo?.lastMessage;
    if (!lastMessage) return;

    const seenBy = selectedConvo?.seenBy ?? [];

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLastMessageStatus(seenBy.length > 0 ? "seen" : "delivered");
  }, [selectedConvo]);

  useLayoutEffect(() => {
    if (!messagesEndRef.current) return;

    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [activeConversationId]);

  const fecthMoreMessages = async () => {
    if (!activeConversationId) return;
    try {
      await fetchMessages(activeConversationId);
    } catch (error) {
      console.error("Lỗi khi tải thêm tin nhắn:", error);
    }
  }

  const handleScrollSave = () => {
    const container = containerRef.current;
    if (!container || !activeConversationId) return;
    sessionStorage.setItem(
      key, 
      JSON.stringify({
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
      })
    );
  }

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container ) return; 

    const item = sessionStorage.getItem(key);
    if (item) {
      const {scrollTop} = JSON.parse(item);
      requestAnimationFrame(() => {
        container.scrollTop = scrollTop;
      });
    }
  }, [messages.length]);

  if (!activeConversationId) {
    return <ChatWelcomeSceen/>
  }

  if (!selectedConvo) {
    return <ChatWelcomeSceen/>
  }

  if(!messages?.length) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Chưa có tin nhắn nào trong cuộc trò chuyện này
      </div>
    )
  }

  return (
    <div className="p-4 bg-primary-foreground h-full flex flex-col overflow-hidden">
      <div 
        ref={containerRef} 
        id="scrollableDiv" 
        className="flex flex-col-reverse overflow-y-auto overflow-x-hidden beautiful-scrollbar"
        onScroll={handleScrollSave}
      >
        <div ref={messagesEndRef}></div>
        <InfiniteScroll
          dataLength={messages.length}
          next={fecthMoreMessages} 
          hasMore={hasMore}
          scrollableTarget="scrollableDiv"
          loader={<div className="text-center text-sm text-muted-foreground py-2">Đang tải thêm tin nhắn...</div>}
          inverse={true}
          style={{ display: 'flex', flexDirection: 'column-reverse', overflow: 'visible' }}
        >
          {reverseMessages.map((message, index) => (
          <MessageItem
            key={message._id ?? index}
            message={message}
            index={index}
            messages={reverseMessages}
            selectedConvo={selectedConvo}
            lastMessageStatus={lastMessageStatus}
          />
        ))}
        </InfiniteScroll>
      </div>
    </div>
  )
}

export default ChatWindowBody