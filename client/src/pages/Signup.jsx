import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AuthShell, Field } from "./Login";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    centerName: "",
    phone: "",
    city: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await signup(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="🚀 Create Your Account"
      subtitle="Join us and set up your tuition center in just a few minutes."
      footer={
        <div className="text-center text-sm text-slate-600 pt-2">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold bg-gradient-to-r from-fuchsia-600 to-violet-600 bg-clip-text text-transparent hover:opacity-80 transition"
          >
            Sign In
          </Link>
        </div>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-3xl border border-white/30 bg-white/80 backdrop-blur-xl p-8 shadow-2xl"
      >
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
            ⚠️ {error}
          </div>
        )}

        <Field
          label="👤 Full Name"
          value={form.name}
          onChange={update("name")}
          required
        />

        <Field
          label="📧 Email Address"
          type="email"
          value={form.email}
          onChange={update("email")}
          required
        />

        <Field
          label="🔒 Password"
          type="password"
          value={form.password}
          onChange={update("password")}
          required
        />

        <Field
          label="🏫 Tuition / Center Name"
          value={form.centerName}
          onChange={update("centerName")}
          required
        />

        <Field
          label="📱 Phone Number"
          type="tel"
          value={form.phone}
          onChange={update("phone")}
          required
        />

        <Field
          label="📍 City"
          value={form.city}
          onChange={update("city")}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="group w-full rounded-xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-fuchsia-400/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-20"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-80"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Creating Account...
            </span>
          ) : (
            "✨ Create Account"
          )}
        </button>
      </form>
    </AuthShell>
  );
}
