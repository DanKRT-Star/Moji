import express from "express";
import { authMe, searchUsersByUsername, uploadAvatar } from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleWare.js";

const router = express.Router();

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Lấy thông tin user hiện tại (đang đăng nhập)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Thông tin user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 */
router.get("/me", authMe);

/**
 * @openapi
 * /users/search:
 *   get:
 *     summary: Tìm user theo username chính xác
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Kết quả tìm kiếm (null nếu không tìm thấy)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   allOf:
 *                     - $ref: '#/components/schemas/User'
 *                   nullable: true
 *       400:
 *         description: Thiếu query param username
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get("/search", searchUsersByUsername);

/**
 * @openapi
 * /users/uploadAvatar:
 *   post:
 *     summary: Upload avatar (tự động crop vuông 200x200, giới hạn 1MB)
 *     tags: [Users]
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
 *                 avatarUrl: { type: string }
 *       400:
 *         description: Chưa chọn file
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/uploadAvatar", upload.single('file'), uploadAvatar);

export default router;