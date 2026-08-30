import express from "express";

import { 
    sendFriendRequest, 
    acceptFriendRequest,
    declineFriendRequest,
    getAllFriends,
    getFriendRequests
} from "../controllers/friendController.js";

const router = express.Router();

/**
 * @openapi
 * /friends/requests:
 *   post:
 *     summary: Gửi lời mời kết bạn
 *     tags: [Friends]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientId]
 *             properties:
 *               recipientId: { type: string }
 *     responses:
 *       201:
 *         description: Đã gửi lời mời
 *       400:
 *         description: Thiếu recipientId hoặc đã là bạn bè
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/requests', sendFriendRequest);

/**
 * @openapi
 * /friends/requests/{requestId}/accept:
 *   post:
 *     summary: Chấp nhận lời mời kết bạn
 *     tags: [Friends]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Đã chấp nhận, trở thành bạn bè
 *       404:
 *         description: Không tìm thấy lời mời
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/requests/:requestId/accept', acceptFriendRequest);

/**
 * @openapi
 * /friends/requests/{requestId}/decline:
 *   post:
 *     summary: Từ chối lời mời kết bạn
 *     tags: [Friends]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Đã từ chối
 *       404:
 *         description: Không tìm thấy lời mời
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/requests/:requestId/decline', declineFriendRequest);

/**
 * @openapi
 * /friends:
 *   get:
 *     summary: Lấy danh sách bạn bè của user hiện tại
 *     tags: [Friends]
 *     responses:
 *       200:
 *         description: Danh sách bạn bè
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 friends:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/User' }
 */
router.get('/', getAllFriends);

/**
 * @openapi
 * /friends/requests:
 *   get:
 *     summary: Lấy danh sách lời mời kết bạn (đã gửi + đã nhận)
 *     tags: [Friends]
 *     responses:
 *       200:
 *         description: Danh sách lời mời
 */
router.get('/requests', getFriendRequests)

export default router