import mongoose from 'mongoose';

const centerSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('Center', centerSchema);
