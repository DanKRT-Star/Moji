import express from "express";
import { authMe, searchUsersByUsername, uploadAvatar } from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleWare.js";

const router = express.Router();

router.get("/me", authMe);
router.get("/search", searchUsersByUsername);
router.post("/uploadAvatar", upload.single('file'), uploadAvatar);

export default router;