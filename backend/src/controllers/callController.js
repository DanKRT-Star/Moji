import Call from "../models/Call.js";

// Lấy lịch sử cuộc gọi của 1 conversation
export const getCallHistory = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        const calls = await Call.find({
            conversationId,
            $or: [{ callerId: userId }, { calleeId: userId }]
        })
        .sort({ createdAt: -1 })
        .populate("callerId", "displayName avatarUrl")
        .populate("calleeId", "displayName avatarUrl");

        return res.status(200).json({ calls });
    } catch (error) {
        console.error("Lỗi khi lấy lịch sử cuộc gọi", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};