import api from "@/lib/axios";

export const friendService = {
    async searchUsersByUsername(username: string) {
        const res = await api.get(`/users/search?username=${username}`);
        return res.data.user;
    },

    async sendFriendRequest(to: string, message?: string) {
        const res = await api.post("/friends/requests", { to, message });
        return res.data;
    },

    async getAllFriendRequests() {
        try {
            const res = await api.get("/friends/requests");
            const {sent, received} = res.data;
            return {sent, received};
        } catch (error) {
            console.error("Lỗi khi lấy danh sách lời mời kết bạn:", error);
        }
    },

    async acceptRequest(requestId: string) {
        try {
            const res = await api.post(`/friends/requests/${requestId}/accept`);
            return res.data.requestAcceptedBy;
        } catch (error) {
            console.error("Lỗi khi chấp nhận lời mời kết bạn:", error);
        }
    }, 

    async declineRequest(requestId: string) {
        try {
            await api.post(`/friends/requests/${requestId}/decline`);
        } catch (error) {
            console.error("Lỗi khi từ chối lời mời kết bạn:", error);
        }
    },

    async getFriendList() {
        const res = await api.get("/friends");
        return res.data.friends;
    }
}