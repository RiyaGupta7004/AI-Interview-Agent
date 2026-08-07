import express from "express";

const router = express.Router();

// GET /health
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    message: "Server is healthy",
  });
});

export default router;
