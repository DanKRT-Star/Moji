import { friendService } from "@/services/friendService";
import type { FriendState } from "@/types/store";
import { create } from "zustand";

export const useFriendStore = create<FriendState>((set) => ({
    friends: [],
    loading: false,
    receivedList: [],
    sentList: [],
    searchByUsername: async (username) => {
        try {
            set({loading: true});
            const user = await friendService.searchUsersByUsername(username);
            return user;
        } catch (error) {
            set({loading: false});
            console.error("Lỗi khi tìm kiếm user theo username:", error);
            return null;
        } finally {
            set({loading: false});
        }
    },
    
    addFriend: async (to, message) => {
        try {
            set({loading: true});
            const res = await friendService.sendFriendRequest(to, message);
            return res;
        } catch (error) {
            console.error("Lỗi khi gửi lời mời kết bạn:", error);
            return "Lỗi khi gửi lời mời kết bạn";
        } finally {
            set({loading: false});
        }
    },

    getAllFriendRequests: async () => {
        try {
            set({loading: true});
            const result = await friendService.getAllFriendRequests();
            if (!result) return;
            const {sent, received} = result;
            set({sentList: sent || [], receivedList: received || []});
        } catch (error) {
            console.error("Lỗi khi lấy danh sách lời mời kết bạn:", error);
        } finally {
            set({loading: false});
        }
    },

    acceptRequest: async (requestId) => {
        try {
            set({loading: true});
            await friendService.acceptRequest(requestId);
            set((state) => ({
                receivedList: state.receivedList.filter((req) => req._id !== requestId)
            }));
        }
        catch (error) {
            console.error("Lỗi khi chấp nhận lời mời kết bạn:", error);
        } finally {
            set({loading: false});
        }
    },

    declineRequest: async (requestId) => {
        try {
            set({loading: true});
            await friendService.declineRequest(requestId);
            set((state) => ({
                receivedList: state.receivedList.filter(req => req._id !== requestId)
            }));
        } catch (error) {
            console.error("Lỗi khi từ chối lời mời kết bạn:", error);
        } finally {
            set({loading: false});
        }
    },

    getFriends: async () => {
        try {
            set({loading: true});
            const friends = await friendService.getFriendList();
            set({friends: friends});
        } catch (error) {
            console.error("Lỗi khi lấy danh sách bạn bè:", error);
            set({friends: []});
        } finally {
            set({loading: false});
        }
    },
}));