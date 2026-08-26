import express from "express";
import { getCallHistory } from "../controllers/callController.js";

const router = express.Router();

router.get("/:conversationId", getCallHistory);

export default router;