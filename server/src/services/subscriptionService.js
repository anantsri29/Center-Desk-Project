import Subscription from "../models/Subscription.js";
import Student from "../models/Student.js";

export const FREE_PLAN_STUDENT_LIMIT = 50;

export function getPlanConfig(plan) {
  switch (plan) {
    case "PRO_MONTHLY":
      return {
        studentLimit: null,
        isUnlimited: true,
        amount: 499,
        billingCycle: "MONTHLY",
      };
    case "PRO_YEARLY":
      return {
        studentLimit: null,
        isUnlimited: true,
        amount: 4999,
        billingCycle: "YEARLY",
      };
    case "PROMOTIONAL":
      return {
        studentLimit: null,
        isUnlimited: true,
        amount: 0,
        billingCycle: "NONE",
      };
    case "LIFETIME":
      return {
        studentLimit: null,
        isUnlimited: true,
        amount: 0,
        billingCycle: "ONE_TIME",
      };
    case "FREE":
    default:
      return {
        studentLimit: FREE_PLAN_STUDENT_LIMIT,
        isUnlimited: false,
        amount: 0,
        billingCycle: "NONE",
      };
  }
}

export async function ensureSubscriptionForCenter(centerId, ownerId) {
  let subscription = await Subscription.findOne({ centerId });

  if (!subscription) {
    subscription = await Subscription.create({
      centerId,
      ownerId,
      plan: "FREE",
      status: "ACTIVE",
      studentLimit: FREE_PLAN_STUDENT_LIMIT,
      isUnlimited: false,
      billingCycle: "NONE",
      amount: 0,
      currency: "INR",
      paymentProvider: "none",
    });
  }

  return subscription;
}

export async function getActiveSubscriptionForCenter(centerId) {
  return Subscription.findOne({ centerId }).lean();
}

export async function checkCanAddActiveStudent(centerId) {
  const subscription = await getActiveSubscriptionForCenter(centerId);
  const activeCount = await Student.countDocuments({ centerId, active: true });

  if (!subscription) {
    return {
      allowed: false,
      count: activeCount,
      limit: FREE_PLAN_STUDENT_LIMIT,
      subscription: null,
    };
  }

  if (subscription.isUnlimited) {
    return { allowed: true, count: activeCount, limit: null, subscription };
  }

  const limit = subscription.studentLimit || FREE_PLAN_STUDENT_LIMIT;
  return {
    allowed: activeCount < limit,
    count: activeCount,
    limit,
    subscription,
  };
}

export async function updateSubscriptionFromPlan(
  subscription,
  plan,
  overrides = {},
) {
  const config = getPlanConfig(plan);

  Object.assign(subscription, {
    plan,
    status: overrides.status || "ACTIVE",
    billingCycle: overrides.billingCycle || config.billingCycle,
    studentLimit:
      overrides.studentLimit ??
      (config.isUnlimited ? null : config.studentLimit),
    isUnlimited: overrides.isUnlimited ?? config.isUnlimited,
    amount: overrides.amount ?? config.amount,
    currency: overrides.currency || "INR",
    paymentProvider: overrides.paymentProvider || "none",
    startedAt: overrides.startedAt || subscription.startedAt || new Date(),
    expiresAt: overrides.expiresAt ?? null,
    autoRenew: overrides.autoRenew ?? false,
  });

  await subscription.save();
  return subscription;
}
