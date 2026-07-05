import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    centerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    plan: { type: String, enum: ['free', 'paid'], default: 'free' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('User', userSchema);
