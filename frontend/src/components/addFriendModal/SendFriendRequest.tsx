import type { UseFormRegister } from "react-hook-form"
import type { IFormValues } from "../chat/AddFriendModal"
import { Label } from "@radix-ui/react-label";
import { Textarea } from "../ui/textarea";
import { DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { UserPlus } from "lucide-react";

interface SendFriendRequestProps {
    register: UseFormRegister<IFormValues>;
    loading: boolean;
    searchedUsername: string;
    onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
    onBack: () => void;
}

const SendFriendRequest = ({
    register,
    loading,
    searchedUsername,
    onSubmit,
    onBack
}: SendFriendRequestProps
) => {
  return (
    <form onSubmit={onSubmit}>
        <div className="space-y-4">
            <span className="text-sm text-emerald-500">
                Tìm thấy <span className="font-semibold">@{searchedUsername}</span> rồi nè
            </span>
            <div className="space-y-4">
                <Label htmlFor="message" className="font-semibold text-sm">
                    Giới thiệu
                </Label>
                <Textarea
                    id="message"
                    rows={3}
                    placeholder="Chào bạn ~ mình muốn kết bạn với bạn nhé!"
                    className="rounded-sm border-border/50 focus:border-primary/50 transition-smooth resize-none glass"
                    {...register("message")}
                />
            </div>
            <DialogFooter>
                <Button 
                    type="button"
                    variant="outline"
                    className="flex-1 glass hover:text-destructive"
                    onClick={onBack}
                >
                    Quay lại    
                </Button>

                <Button 
                    type="submit"
                    className="flex-1 bg-gradient-chat text-white hover:opacity-90 transition-smooth"
                    disabled={loading}
                >
                    {
                        loading ? (
                            <span>Đang gửi...</span>
                        ) : (
                            <><UserPlus className="size-4 mr-2"/> Kết bạn </>
                        )
                    }
                </Button>
            </DialogFooter>
        </div>
    </form>
  )
}

export default SendFriendRequest