import { useThemeStore } from "@/stores/useThemeStore";
import { Popover } from "../ui/popover";
import { PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { Smile } from "lucide-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

interface EmojiPickerProps {
    onChange: (value: string) => void;
}

export const EmojiPicker = ({onChange} : EmojiPickerProps) => {
  const {isDark} = useThemeStore();
  
    return (
    <Popover>
        <PopoverTrigger className="cursor-pointer">
            <Smile className="size-4"/>
        </PopoverTrigger>
        <PopoverContent side="right" className="bg-transparent border-none shadow-none drop-shadow-none mb-16">
            <Picker
                theme={isDark ? "dark" : "light"}
                data={data}
                onEmojiSelect={(emoji: any) => onChange(emoji.native)}
                emojiSize={24}
            />
        </PopoverContent>
    </Popover>
  )
}
