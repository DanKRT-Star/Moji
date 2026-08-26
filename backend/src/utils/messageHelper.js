export const updateConversationAfterCreateMessage = (
  conversation,
  message,
  senderId
) => {
  conversation.set({
    seenBy: [],
    lastMessageAt: message.createdAt,
    lastMessage: {
      _id: message._id,
      content: message.content,
      senderId,
      createdAt: message.createdAt,
    },
  });

  conversation.participants.forEach((p) => {
    // p._id có thể đã populate (document User) hoặc chưa (ObjectId thô)
    // tuỳ thời điểm hàm này được gọi -> luôn lấy đúng id bằng cách này
    const memberId = (p._id?._id ?? p._id).toString();
    const isSender = memberId === senderId.toString();
    const prevCount = conversation.unreadCounts.get(memberId) || 0;
    conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1);
  });
};

export const emitNewMessage = (io, conversation, message) => {
  // conversation.participants._id phải đã được populate (displayName, avatarUrl)
  // trước khi gọi hàm này, xem messageController.js
  const participants = (conversation.participants || []).map((p) => ({
    _id: p._id?._id ?? p._id,
    displayName: p._id?.displayName,
    avatarUrl: p._id?.avatarUrl ?? null,
    joinedAt: p.joinedAt,
  }));

  const participantIds = participants.map((p) => p._id.toString());

  // emit vào CẢ room hội thoại (cho những ai đã join từ trước) LẪN room
  // cá nhân của từng thành viên (cho trường hợp conversation vừa mới tạo,
  // người nhận chưa kịp join room hội thoại) - io.to(array) tự dedupe nếu
  // 1 socket nằm trong nhiều room được nhắm tới cùng lúc
  const rooms = [conversation._id.toString(), ...participantIds];

  io.to(rooms).emit("new-message", {
    message,
    conversation: {
      _id: conversation._id,
      type: conversation.type,
      participants,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      seenBy: conversation.seenBy,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    },
    unreadCounts: Object.fromEntries(conversation.unreadCounts),
  });
};