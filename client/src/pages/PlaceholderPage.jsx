import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const statusStyles = {
  present: "bg-emerald-50 text-emerald-700",
  absent: "bg-rose-50 text-rose-700",
  late: "bg-amber-50 text-amber-700",
};

export default function PlaceholderPage({ section = "dashboard" }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (section === "settings") {
      api
        .get("/api/subscription/me")
        .then((res) => setSubscription(res.data.subscription))
        .catch(() => setSubscription(null));
    }

    if (section !== "attendance") return;

    const loadAttendance = async () => {
      setLoading(true);
      try {
        const response = await api.get("/api/attendance", { params: { date } });
        setStudents(response.data.students || []);
        setMessage("");
      } catch {
        setMessage("Unable to load attendance right now.");
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, [date, section]);

  const saveAttendance = async () => {
    setSaving(true);
    try {
      await api.post("/api/attendance/bulk", {
        date,
        entries: students.map((student) => ({
          studentId: student._id,
          status: student.status,
        })),
      });
      setMessage("Attendance saved successfully.");
    } catch {
      setMessage("Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0 };
    students.forEach((student) => {
      counts[student.status] += 1;
    });
    return counts;
  }, [students]);

  if (section === "settings") {
    return (
      <div className="p-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
                Settings
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-900">
                Plan & account
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Manage your center profile and subscription status from here.
              </p>
            </div>
            <a
              href="mailto:hello@centerdesk.app?subject=Upgrade%20CenterDesk%20Plan"
              className="inline-flex items-center justify-center rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              Upgrade plan
            </a>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-medium text-gray-500">Current plan</p>
              <p className="mt-2 text-2xl font-semibold capitalize text-gray-900">
                {user?.plan || "free"}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Includes up to 50 active students and the full parent portal
                experience.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-medium text-gray-500">Center</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {user?.centerName || "Your center"}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Owner: {user?.name || "Center owner"}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-medium text-gray-500">Subscription</p>
              <p className="mt-2 text-2xl font-semibold capitalize text-gray-900">
                {subscription?.plan?.toLowerCase?.() || user?.plan || "free"}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Status: {subscription?.status?.toLowerCase?.() || "active"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-medium text-gray-500">
                Student capacity
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {subscription?.isUnlimited
                  ? "Unlimited"
                  : subscription?.studentLimit || 50}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Upgrade anytime to scale beyond the free plan limits.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-brand-200 bg-brand-50 p-5 text-sm text-brand-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Subscription management</p>
                <p className="mt-1">
                  Use the pricing section to upgrade or renew your plan.
                </p>
              </div>
              <Link
                to="/dashboard/pricing"
                className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                View plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === "attendance") {
    return (
      <div className="p-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
                Attendance
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-900">
                Daily student attendance
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Choose a date, mark each student present, absent, or late, and
                save it in one go.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={saveAttendance}
                disabled={saving || loading}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save attendance"}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700">
              <p className="text-sm">Present</p>
              <p className="mt-1 text-2xl font-semibold">{summary.present}</p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-700">
              <p className="text-sm">Absent</p>
              <p className="mt-1 text-2xl font-semibold">{summary.absent}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-700">
              <p className="text-sm">Late</p>
              <p className="mt-1 text-2xl font-semibold">{summary.late}</p>
            </div>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
              {message}
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                Loading students...
              </div>
            ) : students.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                No active students found for this center yet.
              </div>
            ) : (
              students.map((student) => (
                <div
                  key={student._id}
                  className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {student.name}
                    </p>
                    <p className="text-sm text-gray-500">{student.batch}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["present", "absent", "late"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          setStudents((current) =>
                            current.map((item) =>
                              item._id === student._id
                                ? { ...item, status }
                                : item,
                            ),
                          );
                        }}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize transition ${student.status === status ? statusStyles[status] : "bg-white text-gray-600 border border-gray-200"}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
          Overview
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">
          More center tools
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          This section is ready for the next set of center operations.
        </p>
      </div>
    </div>
  );
}
