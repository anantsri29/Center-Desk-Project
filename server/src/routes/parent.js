import { Router } from "express";
import Student from "../models/Student.js";
import Center from "../models/Center.js";
import FeeRecord from "../models/FeeRecord.js";
import TestScore from "../models/TestScore.js";
import { formatScoreForChart, groupScoresBySubject } from "../utils/scores.js";

const router = Router();

router.get("/:studentId/:accessToken", async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.studentId,
      portalToken: req.params.accessToken,
      active: true,
    });

    if (!student) return res.status(404).json({ message: "Student not found" });

    const center = await Center.findById(student.centerId);
    const scores = await TestScore.find({
      centerId: student.centerId,
      studentId: student._id,
    }).sort({
      date: 1,
    });
    const feeRecords = await FeeRecord.find({ studentId: student._id })
      .sort({ dueDate: -1 })
      .limit(6);
    const latestFeeRecord = feeRecords[0];

    const feeSummary = latestFeeRecord
      ? {
          status: latestFeeRecord.status,
          amountDue: latestFeeRecord.amountDue,
          amountPaid: latestFeeRecord.amountPaid,
          summary: `${latestFeeRecord.status === "paid" ? "All dues are cleared" : "A fee payment is still pending"}.`,
          balanceLabel: `Balance ₹${Math.max(0, latestFeeRecord.amountDue - latestFeeRecord.amountPaid).toLocaleString("en-IN")}`,
        }
      : {
          status: "none",
          amountDue: 0,
          amountPaid: 0,
          summary: "No fee records have been created for this student yet.",
          balanceLabel: "No fee records yet",
        };

    const attendanceSummary = {
      recordedDays: 0,
      presentDays: 0,
      absentDays: 0,
      status: "Attendance data is not yet being tracked for this student.",
    };

    res.json({
      student: {
        name: student.name,
        batch: student.batch,
        subjects: student.subjects,
        parentName: student.parentName,
      },
      center: { name: center?.name || "Tuition Center" },
      scores: scores.map(formatScoreForChart),
      history: groupScoresBySubject(scores),
      feeSummary,
      attendanceSummary,
    });
  } catch (err) {
    console.error("Parent portal error:", err);
    res.status(500).json({ message: "Failed to load portal" });
  }
});

export default router;
