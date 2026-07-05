import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Center",
      required: true,
      index: true,
      unique: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ["FREE", "PRO_MONTHLY", "PRO_YEARLY", "PROMOTIONAL", "LIFETIME"],
      default: "FREE",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "PENDING", "CANCELLED", "PAST_DUE"],
      default: "ACTIVE",
    },
    billingCycle: {
      type: String,
      enum: ["MONTHLY", "YEARLY", "ONE_TIME", "NONE"],
      default: "NONE",
    },
    studentLimit: { type: Number, default: 50 },
    isUnlimited: { type: Boolean, default: false },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    paymentProvider: { type: String, default: "none" },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySubscriptionId: { type: String, default: "" },
    razorpayCustomerId: { type: String, default: "" },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    autoRenew: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("Subscription", subscriptionSchema);
