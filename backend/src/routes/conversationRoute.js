import express from "express";
import { createConversation, getConversations, getMessages, markAsSeen } from "../controllers/conversationController.js";
import { checkFriendShip } from "../middlewares/friendMiddleWare.js";

const router = express.Router();

/**
 * @openapi
 * /conversations:
 *   post:
 *     summary: Tạo cuộc trò chuyện mới (direct hoặc group)
 *     description: >
 *       Với type "direct" cần recipientId; với "group" cần memberIds
 *       (mảng). Tất cả thành viên phải đã là bạn bè với người tạo
 *       (kiểm tra qua checkFriendShip).
 *     tags: [Conversations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type: { type: string, enum: [direct, group] }
 *               name: { type: string, description: "Tên nhóm (nếu type=group)" }
 *               recipientId: { type: string, description: "Nếu type=direct" }
 *               memberIds:
 *                 type: array
 *                 items: { type: string }
 *                 description: "Nếu type=group"
 *     responses:
 *       201:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversation: { $ref: '#/components/schemas/Conversation' }
 *       403:
 *         description: Có thành viên chưa là bạn bè
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/", checkFriendShip, createConversation);

/**
 * @openapi
 * /conversations:
 *   get:
 *     summary: Lấy danh sách cuộc trò chuyện của user hiện tại
 *     tags: [Conversations]
 *     responses:
 *       200:
 *         description: Danh sách conversation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Conversation' }
 */
router.get("/", getConversations);

/**
 * @openapi
 * /conversations/{conversationId}/messages:
 *   get:
 *     summary: Lấy tin nhắn của 1 cuộc trò chuyện (phân trang cursor)
 *     tags: [Conversations]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *         description: "_id của tin nhắn cũ nhất đã tải, để lấy trang tiếp theo"
 *     responses:
 *       200:
 *         description: Danh sách tin nhắn + cursor cho trang kế tiếp
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Message' }
 *                 nextCursor: { type: string, nullable: true }
 */
router.get("/:conversationId/messages", getMessages);

/**
 * @openapi
 * /conversations/{conversationId}/seen:
 *   patch:
 *     summary: Đánh dấu đã xem cuộc trò chuyện (reset unread count)
 *     tags: [Conversations]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Đã đánh dấu đã xem
 */
router.patch("/:conversationId/seen", markAsSeen) 

export default router;