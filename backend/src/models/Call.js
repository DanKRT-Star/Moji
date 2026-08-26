import mongoose from "mongoose";

const callSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
        index: true
    },

    callerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    calleeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    type: {
        type: String,
        enum: ["audio", "video"],
        required: true
    },

    status: {
        type: String,
        enum: ["ringing", "ongoing", "completed", "missed", "rejected", "cancelled"],
        default: "ringing"
    },

    startedAt: {
        type: Date,
        default: null
    },

    endedAt: {
        type: Date,
        default: null
    },

    // thời lượng cuộc gọi tính bằng giây
    duration: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

callSchema.index({ conversationId: 1, createdAt: -1 });

const Call = mongoose.model("Call", callSchema);
export default Call;