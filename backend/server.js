import "dotenv/config";
import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Core middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/health", healthRoutes);
app.use("/api/interview", interviewRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
