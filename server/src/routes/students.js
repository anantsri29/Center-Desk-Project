import { Router } from "express";
import crypto from "crypto";
import Student from "../models/Student.js";
import Subscription from "../models/Subscription.js";
import { authMiddleware } from "../middleware/auth.js";
import { checkCanAddActiveStudent } from "../services/subscriptionService.js";

const router = Router();

router.use(authMiddleware);

function planLimitResponse(res, count, limit) {
  console.log("[upgrade-intent]", {
    reason: "student_limit",
    count,
    limit,
    timestamp: new Date().toISOString(),
  });

  return res.status(402).json({
    success: false,
    message: "You have reached your student limit. Upgrade your subscription.",
    code: "PLAN_LIMIT_REACHED",
    limit,
    current: count,
  });
}

router.get("/", async (req, res) => {
  try {
    const { centerId } = req.user;
    const { batch, search, active } = req.query;

    const filter = { centerId };

    if (batch) filter.batch = batch;
    if (active === "true") filter.active = true;
    else if (active === "false") filter.active = false;

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { name: regex },
        { parentName: regex },
        { parentPhone: regex },
      ];
    }

    const students = await Student.find(filter).sort({ name: 1 });
    for (const student of students) {
      if (!student.portalToken) {
        student.portalToken = crypto.randomBytes(16).toString("hex");
        await student.save();
      }
    }
    const batches = await Student.distinct("batch", { centerId, active: true });
    const activeCount = await Student.countDocuments({
      centerId,
      active: true,
    });

    const subscription =
      (await req.user?.centerId) && Student.model("Subscription");
    res.json({
      students,
      batches,
      activeCount,
      limit: null,
    });
  } catch (err) {
    console.error("List students error:", err);
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      centerId: req.user.centerId,
    });
    if (!student) return res.status(404).json({ message: "Student not found" });
    if (!student.portalToken) {
      student.portalToken = crypto.randomBytes(16).toString("hex");
      await student.save();
    }
    res.json({ student });
  } catch (err) {
    console.error("Get student error:", err);
    res.status(500).json({ message: "Failed to fetch student" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { centerId } = req.user;
    const { allowed, count, limit } = await checkCanAddActiveStudent(centerId);

    if (!allowed) {
      return planLimitResponse(res, count, limit);
    }

    const {
      name,
      parentName,
      parentPhone,
      studentPhone,
      batch,
      subjects,
      feeAmount,
      feeFrequency,
      joinDate,
    } = req.body;

    if (
      !name ||
      !parentName ||
      !parentPhone ||
      !batch ||
      feeAmount == null ||
      !feeFrequency ||
      !joinDate
    ) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const student = await Student.create({
      centerId,
      name,
      parentName,
      parentPhone,
      studentPhone: studentPhone || "",
      batch,
      subjects: Array.isArray(subjects) ? subjects : [],
      feeAmount,
      feeFrequency,
      joinDate,
      active: true,
    });

    res.status(201).json({ student });
  } catch (err) {
    console.error("Create student error:", err);
    res.status(500).json({ message: "Failed to create student" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { centerId } = req.user;
    const student = await Student.findOne({ _id: req.params.id, centerId });

    if (!student) return res.status(404).json({ message: "Student not found" });

    const reactivating = req.body.active === true && !student.active;
    if (reactivating) {
      const { allowed, count, limit } =
        await checkCanAddActiveStudent(centerId);
      if (!allowed) return planLimitResponse(res, count, limit);
    }

    const fields = [
      "name",
      "parentName",
      "parentPhone",
      "studentPhone",
      "batch",
      "subjects",
      "feeAmount",
      "feeFrequency",
      "joinDate",
      "active",
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        student[field] = req.body[field];
      }
    }

    await student.save();
    res.json({ student });
  } catch (err) {
    console.error("Update student error:", err);
    res.status(500).json({ message: "Failed to update student" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      centerId: req.user.centerId,
    });

    if (!student) return res.status(404).json({ message: "Student not found" });

    student.active = false;
    await student.save();

    res.json({ student, message: "Student marked inactive" });
  } catch (err) {
    console.error("Delete student error:", err);
    res.status(500).json({ message: "Failed to deactivate student" });
  }
});

export default router;
