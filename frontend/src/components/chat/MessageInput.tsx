import { useAuthStore } from "@/stores/useAuthStore"
import type { Conversation } from "@/types/chat";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send, X, Loader2 } from "lucide-react";
import { Input } from "../ui/input";
import { EmojiPicker } from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";


const MessageInput = ({selectedConvo} : {selectedConvo: Conversation}) => {
  const {user} = useAuthStore();
  const [value, setValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const {sendDirectMessage, sendGroupMessage} = useChatStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // tự thu hồi object URL preview cũ để tránh rò rỉ bộ nhớ mỗi khi đổi ảnh
  // hoặc component unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!user) return;

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại đúng file cũ lần sau nếu cần

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ hỗ trợ gửi file ảnh");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const sendMessage = async () => {
    const trimmed = value.trim();
    if (!trimmed && !selectedFile) return;

    const currValue = trimmed;
    const fileToSend = selectedFile;

    setValue("");
    removeSelectedFile();

    try {
      let imgUrl: string | undefined;

      if (fileToSend) {
        setIsUploading(true);
        imgUrl = await chatService.uploadMessageImage(fileToSend);
      }

      if(selectedConvo.type === "direct") {
        const participants = selectedConvo.participants;
        const otherUser = participants.filter((p) => p._id !== user._id)[0];
        await sendDirectMessage(otherUser._id, currValue, imgUrl)
      } else {
        await sendGroupMessage(selectedConvo._id, currValue, imgUrl)
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn")
    } finally {
      setIsUploading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if(e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }

  const canSend = (value.trim().length > 0 || !!selectedFile) && !isUploading;

  return (
    <div className="flex flex-col gap-2 p-3 min-h-14 bg-background">
      {/* preview ảnh đã chọn, chưa gửi */}
      {previewUrl && (
        <div className="relative w-fit">
          <img
            src={previewUrl}
            alt="Xem trước ảnh"
            className="h-20 w-20 rounded-lg object-cover border border-border/50"
          />
          <button
            onClick={removeSelectedFile}
            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10 transition-smooth"
          onClick={handlePickFile}
          disabled={isUploading}
        >
          <ImagePlus className="size-4"/>
        </Button>

        <div className="flex-1 relative">
          <Input
            onKeyPress={handleKeyPress}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Soạn tin nhắn"
            className="pr-20 h-9 bg-transparent border-border/50 focus:border-primary/50 transition=smooth resize-none"
          >

          </Input>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="size-8 hover:bg-primary/10 transition-smooth"
              >
                <div>
                  <EmojiPicker onChange={(emoji: string) => setValue(`${value}${emoji}`)}/>
                </div>
              </Button>
          </div>
        </div>
        <Button
          onClick={sendMessage}
          className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105"
          disabled={!canSend}
        >
          {isUploading ? (
            <Loader2 className="size-4 text-white animate-spin"/>
          ) : (
            <Send className="size-4 text-white"/>
          )}
        </Button>
      </div>
    </div>
  )
}

export default MessageInput