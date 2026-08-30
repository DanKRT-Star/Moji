import Call from "../models/Call.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { updateConversationAfterCreateMessage, emitNewMessage } from "../utils/messageHelper.js";

const RINGING_TIMEOUT = 45000;

const activeCalls = new Map();

const userCallMap = new Map();

const cleanupCall = (callId, call) => {
    activeCalls.delete(callId);
    if (call) {
        userCallMap.delete(call.callerId);
        userCallMap.delete(call.calleeId);
    }
};

const createCallMessage = async (io, call, callId, status, duration = 0) => {
    try {
        const conversation = await Conversation.findById(call.conversationId);
        if (!conversation) return;

        const message = await Message.create({
            conversationId: call.conversationId,
            senderId: call.callerId,
            type: "call",
            call: {
                callId,
                callerId: call.callerId,
                calleeId: call.calleeId,
                callType: call.type,
                status,
                duration
            }
        });

        updateConversationAfterCreateMessage(conversation, message, call.callerId);
        await conversation.save();

        await conversation.populate({
            path: "participants._id",
            select: "displayName avatarUrl"
        });

        emitNewMessage(io, conversation, message);
    } catch (error) {
        console.error("Lỗi khi tạo message cho cuộc gọi", error);
    }
};

export const registerCallHandlers = (io, socket, onlineUsers) => {
    const userId = socket.user._id.toString();

    // ---- 1. Người gọi gửi lời mời gọi ----
    socket.on("call:invite", async ({ conversationId, calleeId, type }) => {
        try {
            if (!conversationId || !calleeId || !type) return;

            const calleeSocketId = onlineUsers.get(calleeId);
            if (!calleeSocketId) {
                socket.emit("call:unavailable", { calleeId, reason: "offline" });
                return;
            }

            if (userCallMap.has(calleeId)) {
                socket.emit("call:busy", { calleeId });
                return;
            }

            if (userCallMap.has(userId)) {
                socket.emit("call:error", { message: "Bạn đang trong 1 cuộc gọi khác" });
                return;
            }

            const call = await Call.create({
                conversationId,
                callerId: userId,
                calleeId,
                type,
                status: "ringing"
            });

            const callId = call._id.toString();

            activeCalls.set(callId, {
                callerId: userId,
                calleeId,
                conversationId,
                type,
                status: "ringing"
            });

            userCallMap.set(userId, callId);
            userCallMap.set(calleeId, callId);

            io.to(calleeId).emit("call:incoming", {
                callId,
                conversationId,
                type,
                caller: {
                    _id: socket.user._id,
                    displayName: socket.user.displayName,
                    avatarUrl: socket.user.avatarUrl
                }
            });

            socket.emit("call:ringing", { callId });

            // Tự động huỷ nếu không ai bắt máy sau thời gian timeout
            setTimeout(async () => {
                const current = activeCalls.get(callId);
                if (current && current.status === "ringing") {
                    cleanupCall(callId, current);
                    await Call.findByIdAndUpdate(callId, { status: "missed" });
                    io.to(current.callerId).emit("call:timeout", { callId });
                    io.to(current.calleeId).emit("call:timeout", { callId });

                    await createCallMessage(io, current, callId, "missed"); 
                }
            }, RINGING_TIMEOUT);
        } catch (error) {
            console.error("Lỗi khi gọi call:invite", error);
            socket.emit("call:error", { message: "Lỗi hệ thống" });
        }
    });

    // ---- 2. Người nhận chấp nhận cuộc gọi ----
    socket.on("call:accept", async ({ callId }) => {
        try {
            const call = activeCalls.get(callId);
            if (!call) return;

            call.status = "ongoing";
            activeCalls.set(callId, call);

            await Call.findByIdAndUpdate(callId, {
                status: "ongoing",
                startedAt: new Date()
            });

            io.to(call.callerId).emit("call:accepted", { callId });
        } catch (error) {
            console.error("Lỗi khi gọi call:accept", error);
        }
    });

    // ---- 3. Người nhận từ chối cuộc gọi ----
    socket.on("call:reject", async ({ callId }) => {
        try {
            const call = activeCalls.get(callId);
            if (!call) return;

            cleanupCall(callId, call);
            await Call.findByIdAndUpdate(callId, { status: "rejected" });

            io.to(call.callerId).emit("call:rejected", { callId });

            await createCallMessage(io, call, callId, "rejected");   // <-- THÊM
        } catch (error) {
            console.error("Lỗi khi gọi call:reject", error);
        }
    });

    // ---- 4. Người gọi huỷ khi chưa được bắt máy ----
    socket.on("call:cancel", async ({ callId }) => {
        try {
            const call = activeCalls.get(callId);
            if (!call) return;

            cleanupCall(callId, call);
            await Call.findByIdAndUpdate(callId, { status: "cancelled" });

            io.to(call.calleeId).emit("call:cancelled", { callId });

            await createCallMessage(io, call, callId, "cancelled");
        } catch (error) {
            console.error("Lỗi khi gọi call:cancel", error);
        }
    });

    // ---- 5. Kết thúc cuộc gọi (từ 1 trong 2 phía) ----
    socket.on("call:end", async ({ callId }) => {
        try {
            const call = activeCalls.get(callId);
            if (!call) return;

            cleanupCall(callId, call);

            const updateData = { status: "completed", endedAt: new Date() };
            const dbCall = await Call.findById(callId);
            if (dbCall?.startedAt) {
                updateData.duration = Math.round((new Date() - dbCall.startedAt) / 1000);
            }
            await Call.findByIdAndUpdate(callId, updateData);

            const otherUserId = call.callerId === userId ? call.calleeId : call.callerId;
            io.to(otherUserId).emit("call:ended", { callId });

            await createCallMessage(io, call, callId, "completed", updateData.duration ?? 0);   // <-- THÊM
        } catch (error) {
            console.error("Lỗi khi gọi call:end", error);
        }
    });

    // ---- 6. WebRTC signaling — server chỉ relay, không xử lý logic WebRTC ----
    socket.on("call:offer", ({ callId, to, sdp }) => {
        io.to(to).emit("call:offer", { callId, from: userId, sdp });
    });

    socket.on("call:answer", ({ callId, to, sdp }) => {
        io.to(to).emit("call:answer", { callId, from: userId, sdp });
    });

    socket.on("call:ice-candidate", ({ callId, to, candidate }) => {
        io.to(to).emit("call:ice-candidate", { callId, from: userId, candidate });
    });

    socket.on("call:video-toggle", ({ callId, to, enabled }) => {
        io.to(to).emit("call:video-toggle", { callId, from: userId, enabled });
    });

    // ---- 7. User rớt mạng giữa cuộc gọi -> tự động kết thúc ----
    socket.on("disconnect", async () => {
        try {
            const callId = userCallMap.get(userId);
            if (!callId) return;

            const call = activeCalls.get(callId);
            if (!call) return;

            cleanupCall(callId, call);

            const status = call.status === "ongoing" ? "completed" : "missed";
            const updateData = { status, endedAt: new Date() };

            if (status === "completed") {
                const dbCall = await Call.findById(callId);
                if (dbCall?.startedAt) {
                    updateData.duration = Math.round((new Date() - dbCall.startedAt) / 1000);
                }
            }
            await Call.findByIdAndUpdate(callId, updateData);

            const otherUserId = call.callerId === userId ? call.calleeId : call.callerId;
            io.to(otherUserId).emit("call:ended", { callId });

            await createCallMessage(io, call, callId, status, updateData.duration ?? 0);   // <-- THÊM
        } catch (error) {
            console.error("Lỗi khi xử lý disconnect trong callHandlers", error);
        }
    });
};

