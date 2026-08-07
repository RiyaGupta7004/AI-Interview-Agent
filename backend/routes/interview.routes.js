import express from "express";
import {
  startInterview,
  sendMessage,
  endInterview,
} from "../controllers/interview.controller.js";

const router = express.Router();

// POST /api/interview/start
router.post("/start", startInterview);

// POST /api/interview/message
router.post("/message", sendMessage);

// POST /api/interview/end
router.post("/end", endInterview);

export default router;
