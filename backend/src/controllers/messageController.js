import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { io } from "../socket/index.js";
import { emitNewMessage, updateConversationAfterCreateMessage } from "../utils/messageHelper.js";

export const sendDirectMessage = async (req, res) => {

  try {
    const { recipientId, content, conversationId } = req.body;
    const senderId = req.user._id;

    let conversation;
    let isNewConversation = false;

    if (!content) {
      return res.status(400).json({ message: "Thiếu nội dung" });
    }

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [
          { _id: senderId, joinedAt: new Date() },
          { _id: recipientId, joinedAt: new Date() }
        ],
        lastMessageAt: new Date(),
        unreadCounts: new Map()
      });
      isNewConversation = true;
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();

    // conversation vừa mới tạo -> cả 2 người chưa từng join room này
    // (room chỉ được join lúc connect socket, dựa theo các conversation
    // đã tồn tại từ trước đó) -> cho socket đang online của cả 2 join
    // luôn, để các sự kiện real-time sau này (tin nhắn tiếp theo, đã
    // xem...) tới được đúng người mà không phải chờ round-trip từ client
    if (isNewConversation) {
      io.in(senderId.toString()).socketsJoin(conversation._id.toString());
      io.in(recipientId.toString()).socketsJoin(conversation._id.toString());
    }

    // populate để FE nhận được displayName/avatarUrl ngay trong sự kiện
    // socket, không cần fetch lại - tránh hiện fallback "M" cho user mới
    await conversation.populate({
      path: "participants._id",
      select: "displayName avatarUrl"
    });

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn trực tiếp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;

    if (!content) {
      return res.status(400).json("Thiếu nội dung");
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();

    // đồng bộ với sendDirectMessage - đảm bảo participants luôn populate
    // trước khi emit, tránh hiện fallback "M" cho thành viên nhóm
    await conversation.populate({
      path: "participants._id",
      select: "displayName avatarUrl"
    });

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};