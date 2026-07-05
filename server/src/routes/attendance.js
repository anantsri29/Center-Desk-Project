import { Router } from "express";
import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

function getDateString(value) {
  if (!value) return getTodayISO();
  return value;
}

router.get("/", async (req, res) => {
  try {
    const { centerId } = req.user;
    const date = getDateString(req.query.date);

    const [students, records] = await Promise.all([
      Student.find({ centerId, active: true }).sort({ name: 1 }).lean(),
      Attendance.find({ centerId, date }).lean(),
    ]);

    const recordMap = new Map(
      records.map((record) => [record.studentId.toString(), record]),
    );

    const rows = students.map((student) => {
      const record = recordMap.get(student._id.toString());
      return {
        _id: student._id,
        name: student.name,
        batch: student.batch,
        status: record?.status || "present",
      };
    });

    res.json({ date, students: rows });
  } catch (err) {
    console.error("Attendance fetch error:", err);
    res.status(500).json({ message: "Failed to load attendance" });
  }
});

router.post("/bulk", async (req, res) => {
  try {
    const { centerId } = req.user;
    const { date, entries } = req.body || {};
    const attendanceDate = getDateString(date);

    if (!Array.isArray(entries)) {
      return res
        .status(400)
        .json({ message: "Attendance entries are required" });
    }

    const validStatuses = new Set(["present", "absent", "late"]);
    const normalizedEntries = entries
      .filter((entry) => entry?.studentId)
      .map((entry) => ({
        studentId: entry.studentId,
        status: validStatuses.has(entry.status) ? entry.status : "present",
      }));

    await Attendance.deleteMany({ centerId, date: attendanceDate });

    if (normalizedEntries.length === 0) {
      return res.json({ date: attendanceDate, saved: [] });
    }

    const docs = normalizedEntries.map((entry) => ({
      centerId,
      studentId: entry.studentId,
      date: attendanceDate,
      status: entry.status,
    }));

    const saved = await Attendance.insertMany(docs, { ordered: false });

    res.json({ date: attendanceDate, saved });
  } catch (err) {
    console.error("Attendance save error:", err);
    res.status(500).json({ message: "Failed to save attendance" });
  }
});

export default router;
