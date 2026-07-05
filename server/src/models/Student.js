import mongoose from 'mongoose';
import crypto from 'crypto';

const studentSchema = new mongoose.Schema(
  {
    centerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Center', required: true, index: true },
    name: { type: String, required: true, trim: true },
    parentName: { type: String, required: true, trim: true },
    parentPhone: { type: String, required: true, trim: true },
    studentPhone: { type: String, trim: true, default: '' },
    batch: { type: String, required: true, trim: true },
    subjects: [{ type: String, trim: true }],
    feeAmount: { type: Number, required: true, min: 0 },
    feeFrequency: { type: String, enum: ['monthly', 'one-time'], required: true },
    joinDate: { type: Date, required: true },
    active: { type: Boolean, default: true },
    portalToken: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(16).toString('hex'),
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

studentSchema.index({ centerId: 1, active: 1 });
studentSchema.index({ centerId: 1, batch: 1 });

export default mongoose.model('Student', studentSchema);
