import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Center",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    status: {
      type: String,
      enum: ["present", "absent", "late"],
      default: "present",
    },
  },
  { timestamps: true },
);

attendanceSchema.index(
  { centerId: 1, date: 1, studentId: 1 },
  { unique: true },
);

export default mongoose.model("Attendance", attendanceSchema);
