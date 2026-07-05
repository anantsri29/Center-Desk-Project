import { Router } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import Subscription from "../models/Subscription.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  ensureSubscriptionForCenter,
  getPlanConfig,
  updateSubscriptionFromPlan,
} from "../services/subscriptionService.js";

const router = Router();
router.use(authMiddleware);

const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_SECRET,
      })
    : null;

function buildRazorpaySignature(body, secret) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

router.get("/me", async (req, res) => {
  try {
    const subscription = await ensureSubscriptionForCenter(
      req.user.centerId,
      req.user.id,
    );
    res.json({ subscription });
  } catch (err) {
    console.error("Subscription fetch error:", err);
    res.status(500).json({ message: "Failed to load subscription" });
  }
});

router.post("/create-order", async (req, res) => {
  try {
    const { plan } = req.body || {};
    const allowedPlans = ["PRO_MONTHLY", "PRO_YEARLY"];
    if (!allowedPlans.includes(plan)) {
      return res.status(400).json({ message: "Unsupported plan" });
    }

    const subscription = await ensureSubscriptionForCenter(
      req.user.centerId,
      req.user.id,
    );
    const config = getPlanConfig(plan);

    const options = {
      amount: config.amount * 100,
      currency: "INR",
      receipt: `${subscription._id}`,
      notes: { centerId: req.user.centerId, plan },
    };

    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message:
          "Razorpay is not configured yet. Add your keys to server/.env to enable payments.",
      });
    }

    const order = await razorpay.orders.create(options);

    subscription.razorpayOrderId = order.id;
    subscription.paymentProvider = "razorpay";
    subscription.plan = "FREE";
    subscription.status = "PENDING";
    await subscription.save();

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: "Failed to create payment order" });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } =
      req.body || {};
    if (!process.env.RAZORPAY_SECRET) {
      return res
        .status(503)
        .json({ success: false, message: "Razorpay is not configured yet." });
    }

    const expected = buildRazorpaySignature(
      `${razorpay_order_id}|${razorpay_payment_id}`,
      process.env.RAZORPAY_SECRET,
    );

    if (expected !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature" });
    }

    const subscription = await Subscription.findOne({
      centerId: req.user.centerId,
    });
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const config = getPlanConfig(plan);
    const now = new Date();
    const expiresAt =
      plan === "PRO_YEARLY"
        ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
        : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    await updateSubscriptionFromPlan(subscription, plan, {
      status: "ACTIVE",
      billingCycle: config.billingCycle,
      studentLimit: null,
      isUnlimited: true,
      amount: config.amount,
      currency: "INR",
      paymentProvider: "razorpay",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      startedAt: now,
      expiresAt,
      autoRenew: plan === "PRO_MONTHLY",
    });

    res.json({ success: true, message: "Subscription activated" });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ message: "Failed to verify payment" });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const body = JSON.stringify(req.body);
    if (!process.env.RAZORPAY_SECRET) {
      return res
        .status(503)
        .json({ message: "Razorpay is not configured yet." });
    }
    const expected = buildRazorpaySignature(body, process.env.RAZORPAY_SECRET);

    if (signature !== expected) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const event = req.body?.event;
    const payload = req.body?.payload || {};

    if (event === "payment.captured") {
      const payment = payload.payment?.entity;
      const subscription = await Subscription.findOne({
        razorpayOrderId: payment?.notes?.order_id || "",
      });
      if (subscription) {
        subscription.razorpayPaymentId = payment.id;
        subscription.status = "ACTIVE";
        await subscription.save();
      }
    }

    if (event === "subscription.charged") {
      const subscription = await Subscription.findOne({
        razorpaySubscriptionId: payload.subscription?.entity?.id,
      });
      if (subscription) {
        subscription.status = "ACTIVE";
        await subscription.save();
      }
    }

    if (event === "payment.failed") {
      const payment = payload.payment?.entity;
      const subscription = await Subscription.findOne({
        razorpayOrderId: payment?.notes?.order_id || "",
      });
      if (subscription) {
        subscription.status = "PAST_DUE";
        await subscription.save();
      }
    }

    if (event === "subscription.cancelled") {
      const subscription = await Subscription.findOne({
        razorpaySubscriptionId: payload.subscription?.entity?.id,
      });
      if (subscription) {
        subscription.status = "CANCELLED";
        subscription.autoRenew = false;
        await subscription.save();
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ message: "Webhook failed" });
  }
});

export default router;
