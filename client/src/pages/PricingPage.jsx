import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const plans = [
  {
    key: "FREE",
    name: "Free",
    price: 0,
    billing: "Forever",
    features: [
      "Up to 50 active students",
      "Parent portal",
      "Fee and score tracking",
    ],
    accent: "from-slate-700 to-slate-900",
  },
  {
    key: "PRO_MONTHLY",
    name: "Pro Monthly",
    price: 499,
    billing: "/month",
    features: [
      "Unlimited students",
      "Priority support",
      "Advanced center insights",
    ],
    accent: "from-violet-600 to-fuchsia-600",
    popular: true,
  },
  {
    key: "PRO_YEARLY",
    name: "Pro Yearly",
    price: 4999,
    billing: "/year",
    features: [
      "Unlimited students",
      "Priority support",
      "Best value for growing centers",
    ],
    accent: "from-orange-500 to-amber-500",
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/api/subscription/me")
      .then((res) => setSubscription(res.data.subscription))
      .catch(() => setSubscription(null));
  }, []);

  const handleUpgrade = async (plan) => {
    if (plan === "FREE") {
      navigate("/dashboard/settings");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/api/subscription/create-order", {
        plan,
      });
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: "CenterDesk Pro",
        description: `${plan} subscription`,
        handler: async (response) => {
          await api.post("/api/subscription/verify", {
            ...response,
            plan,
          });
          navigate("/dashboard/settings");
        },
        prefill: {},
        theme: { color: "#7c3aed" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      window.alert("Unable to start checkout right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            Subscriptions
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">
            Choose the plan that fits your center
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-500">
            Upgrade to unlock unlimited students and more growth-focused tools
            for your coaching business.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = subscription?.plan === plan.key;
            return (
              <div
                key={plan.key}
                className={`rounded-3xl border p-6 ${isCurrent ? "border-violet-300 bg-violet-50" : "border-gray-200 bg-white"}`}
              >
                {plan.popular ? (
                  <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                ) : null}
                <div
                  className={`mt-4 rounded-2xl bg-gradient-to-br ${plan.accent} p-5 text-white`}
                >
                  <p className="text-lg font-semibold">{plan.name}</p>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-4xl font-semibold">
                      ₹{plan.price}
                    </span>
                    <span className="pb-1 text-sm">{plan.billing}</span>
                  </div>
                </div>
                <ul className="mt-5 space-y-2 text-sm text-gray-600">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-brand-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={loading}
                  className={`mt-6 w-full rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${isCurrent ? "bg-emerald-600 text-white" : "bg-brand-600 text-white hover:bg-brand-700"}`}
                >
                  {isCurrent
                    ? "Current Plan"
                    : plan.key === "FREE"
                      ? "Manage"
                      : "Upgrade"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
