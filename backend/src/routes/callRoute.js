import express from "express";
import { getCallHistory } from "../controllers/callController.js";

const router = express.Router();

/**
 * @openapi
 * /calls/{conversationId}:
 *   get:
 *     summary: Lấy lịch sử cuộc gọi của 1 cuộc trò chuyện
 *     description: >
 *       Lưu ý: hầu hết use case hiển thị lịch sử cuộc gọi trong khung
 *       chat được phục vụ bởi tin nhắn dạng "call" (xem schema Message,
 *       field `call`) trả về từ /conversations/{id}/messages - endpoint
 *       này chủ yếu để tra cứu riêng theo collection Call.
 *     tags: [Calls]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Danh sách cuộc gọi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 calls:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Call' }
 */
router.get("/:conversationId", getCallHistory);

export default router;