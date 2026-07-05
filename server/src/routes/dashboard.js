import { Router } from "express";
import Student from "../models/Student.js";
import FeeRecord from "../models/FeeRecord.js";
import Attendance from "../models/Attendance.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

router.get("/overview", async (req, res) => {
  try {
    const { centerId } = req.user;
    const month = getCurrentMonth();
    const today = getTodayISO();

    const [activeCount, feeStats, attendanceRecords, overdueFees] =
      await Promise.all([
        Student.countDocuments({ centerId, active: true }),
        FeeRecord.aggregate([
          { $match: { centerId, month } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              totalDue: { $sum: "$amountDue" },
              totalPaid: { $sum: "$amountPaid" },
            },
          },
        ]),
        Attendance.find({ centerId, date: today }).populate(
          "studentId",
          "name batch",
        ),
        FeeRecord.find({ centerId, status: "overdue" })
          .populate("studentId", "name parentName parentPhone batch")
          .sort({ dueDate: 1 })
          .limit(8),
      ]);

    const stats = {
      paid: 0,
      pending: 0,
      overdue: 0,
      totalDue: 0,
      totalPaid: 0,
    };
    for (const row of feeStats) {
      stats[row._id] = row.count;
      stats.totalDue += row.totalDue;
      stats.totalPaid += row.totalPaid;
    }

    const totalAttendance = attendanceRecords.length;
    const presentAttendance = attendanceRecords.filter(
      (record) => record.status === "present",
    ).length;
    const attendancePercent =
      totalAttendance > 0
        ? Math.round((presentAttendance / totalAttendance) * 100)
        : 0;

    res.json({
      activeCount,
      limit: 50,
      feeStats: stats,
      attendancePercent,
      attendanceTotal: totalAttendance,
      overdueFees: overdueFees.map((record) => ({
        _id: record._id,
        studentName: record.studentId?.name || "Student",
        parentName: record.studentId?.parentName || "Parent",
        parentPhone: record.studentId?.parentPhone || "",
        batch: record.studentId?.batch || "",
        amountDue: record.amountDue,
        amountPaid: record.amountPaid,
        dueDate: record.dueDate,
      })),
    });
  } catch (err) {
    console.error("Dashboard overview error:", err);
    res.status(500).json({ message: "Failed to load dashboard overview" });
  }
});

export default router;
