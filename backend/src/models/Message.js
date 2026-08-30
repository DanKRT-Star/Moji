import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
        index: true
    },

    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    content: {
        type: String,
        trim: true
    },

    imgUrl: {
        type: String,
    },

    type: {
        type: String,
        enum: ["text", "call"],
        default: "text"
    },

    call: {
        callId: { type: mongoose.Schema.Types.ObjectId, ref: "Call" },
        callerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        calleeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        callType: { type: String, enum: ["audio", "video"] },
        status: {
            type: String,
            enum: ["completed", "missed", "rejected", "cancelled"]
        },
        duration: { type: Number, default: 0 }
    }
}, {timestamps: true})

messageSchema.index({conversationId: 1, createdAt: -1});

const Message = mongoose.model("Message", messageSchema);
export default Message