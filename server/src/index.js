import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import cron from "node-cron";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/students.js";
import feeRoutes from "./routes/fees.js";
import scoreRoutes from "./routes/scores.js";
import parentRoutes from "./routes/parent.js";
import dashboardRoutes from "./routes/dashboard.js";
import attendanceRoutes from "./routes/attendance.js";
import subscriptionRoutes from "./routes/subscription.js";
import { generateMonthlyFees } from "./services/feeGeneration.js";
import FeeRecord from "./models/FeeRecord.js";
import { refreshFeeStatuses } from "./utils/feeStatus.js";
const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

async function start() {
  await connectDB();

  // 1st of each month at 06:00 IST — generate fee records for all centers
  cron.schedule(
    "0 6 1 * *",
    async () => {
      try {
        const result = await generateMonthlyFees();
        console.log("[cron] Monthly fee generation:", result);
      } catch (err) {
        console.error("[cron] Fee generation failed:", err);
      }
    },
    { timezone: "Asia/Kolkata" },
  );

  // Daily at 06:30 IST — refresh overdue statuses
  cron.schedule(
    "30 6 * * *",
    async () => {
      try {
        await refreshFeeStatuses(FeeRecord, {});
        console.log("[cron] Refreshed overdue fee statuses");
      } catch (err) {
        console.error("[cron] Fee status refresh failed:", err);
      }
    },
    { timezone: "Asia/Kolkata" },
  );

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
