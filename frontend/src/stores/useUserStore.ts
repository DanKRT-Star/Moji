import { userService } from "@/services/userService";
import type { UserState } from "@/types/store";
import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { toast } from "sonner";

export const useUserStore = create<UserState>(() => ({
    uploadAvatarUrl: async (formData) => {
        try {
            const {user, setUser} = useAuthStore.getState();
            const data = await userService.uploadAvatar(formData);

            if (user) {
                setUser({
                    ...user,
                    avatarUrl: data.avatarUrl
                })
            }
        } catch (error) {
            console.error("Lỗi khi updatedAvatarUrl", error);
            toast.error("Upload avatar không thành công!")
        }
    }
}))