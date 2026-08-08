import express from "express";
import {
  getCandidates,
  startInterview,
  sendMessage,
  endInterview,
} from "../controllers/interview.controller.js";

const router = express.Router();

// GET /api/interview/candidates
router.get("/candidates", getCandidates);

// POST /api/interview/start
router.post("/start", startInterview);

// POST /api/interview/message
router.post("/message", sendMessage);

// POST /api/interview/end
router.post("/end", endInterview);

export default router;
