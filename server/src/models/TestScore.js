import mongoose from 'mongoose';

const testScoreSchema = new mongoose.Schema(
  {
    centerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Center', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subject: { type: String, required: true, trim: true },
    testName: { type: String, required: true, trim: true },
    marksObtained: { type: Number, required: true, min: 0 },
    totalMarks: { type: Number, required: true, min: 1 },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

testScoreSchema.index({ centerId: 1, studentId: 1, date: -1 });

export default mongoose.model('TestScore', testScoreSchema);
