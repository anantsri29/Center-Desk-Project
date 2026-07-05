import mongoose from 'mongoose';

const feeRecordSchema = new mongoose.Schema(
  {
    centerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Center', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    amountDue: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['paid', 'pending', 'overdue'], default: 'pending' },
    paidDate: { type: Date },
  },
  { timestamps: true }
);

feeRecordSchema.index({ centerId: 1, studentId: 1, month: 1 }, { unique: true });
feeRecordSchema.index({ centerId: 1, status: 1, month: 1 });

export default mongoose.model('FeeRecord', feeRecordSchema);
