import express from "express";

import {
    sendDirectMessage,
    sendGroupMessage,
    uploadMessageImage
} from '../controllers/messageController.js'

import { checkFriendShip, checkGroupMembership } from "../middlewares/friendMiddleWare.js";
import { uploadChatImage } from "../middlewares/uploadMiddleWare.js";

const router = express.Router();

/**
 * @openapi
 * /messages/direct:
 *   post:
 *     summary: Gửi tin nhắn trực tiếp (1-1)
 *     description: >
 *       Tạo conversation direct mới nếu chưa có (conversationId không
 *       bắt buộc). Cần content hoặc imgUrl (ít nhất 1 trong 2). Người
 *       nhận phải đã là bạn bè.
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientId]
 *             properties:
 *               recipientId: { type: string }
 *               content: { type: string }
 *               imgUrl:
 *                 type: string
 *                 description: "Lấy từ response của /messages/uploadImage"
 *               conversationId:
 *                 type: string
 *                 description: "Bỏ qua nếu đây là tin nhắn đầu tiên"
 *     responses:
 *       201:
 *         description: Gửi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { $ref: '#/components/schemas/Message' }
 *       400:
 *         description: Thiếu content và imgUrl
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Chưa kết bạn với người nhận
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/direct', checkFriendShip, sendDirectMessage);

/**
 * @openapi
 * /messages/group:
 *   post:
 *     summary: Gửi tin nhắn trong nhóm
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [conversationId]
 *             properties:
 *               conversationId: { type: string }
 *               content: { type: string }
 *               imgUrl: { type: string }
 *     responses:
 *       201:
 *         description: Gửi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { $ref: '#/components/schemas/Message' }
 *       400:
 *         description: Thiếu content và imgUrl
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Không phải thành viên nhóm
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/group', checkGroupMembership, sendGroupMessage);

/**
 * @openapi
 * /messages/uploadImage:
 *   post:
 *     summary: Upload ảnh để đính kèm tin nhắn (giới hạn 5MB, không crop)
 *     description: >
 *       Chỉ upload ảnh lên Cloudinary và trả về URL - CHƯA gửi tin nhắn.
 *       Dùng URL trả về làm imgUrl khi gọi /messages/direct hoặc
 *       /messages/group.
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imgUrl: { type: string }
 *       400:
 *         description: Chưa chọn file
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/uploadImage', uploadChatImage.single('file'), uploadMessageImage);

export default router