import express from "express";
import { signIn, signUp, signOut, refreshToken } from "../controllers/authController.js";

const router = express.Router();

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, email, firstName, lastName]
 *             properties:
 *               username: { type: string }
 *               password: { type: string, format: password }
 *               email: { type: string, format: email }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *     responses:
 *       204:
 *         description: Đăng ký thành công
 *       400:
 *         description: Thiếu thông tin
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: Username đã tồn tại
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/signup", signUp);

/**
 * @openapi
 * /auth/signin:
 *   post:
 *     summary: Đăng nhập
 *     description: >
 *       Trả về access token (JWT, 15 phút) trong response body, và đặt
 *       refresh token (opaque, 14 ngày) vào cookie httpOnly `refreshToken`.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 accessToken: { type: string }
 *       401:
 *         description: Sai username hoặc password
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/signin", signIn);

/**
 * @openapi
 * /auth/signout:
 *   post:
 *     summary: Đăng xuất - thu hồi refresh token hiện tại
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       204:
 *         description: Đăng xuất thành công (idempotent, luôn trả 204)
 */
router.post("/signout", signOut);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Đổi refresh token (cookie) lấy access token mới
 *     description: >
 *       Đọc refresh token từ cookie `refreshToken`, đối chiếu với session
 *       lưu trong DB. Refresh token KHÔNG bị rotate ở endpoint này (khác
 *       với access token, vẫn dùng lại refresh token cũ cho tới khi hết
 *       hạn hoặc logout).
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Cấp access token mới thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *       401:
 *         description: Không có refresh token trong cookie
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Refresh token không hợp lệ hoặc đã hết hạn
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/refresh", refreshToken);

export default router;