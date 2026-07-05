import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import ScoreTrendChart from "../components/ScoreTrendChart";

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [overview, setOverview] = useState({
    activeCount: 0,
    limit: 50,
    feeStats: { pending: 0, overdue: 0, paid: 0, totalDue: 0, totalPaid: 0 },
    attendancePercent: 0,
    overdueFees: [],
  });
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [history, setHistory] = useState({});
  const [historyStudent, setHistoryStudent] = useState(null);

  const fetchOverview = useCallback(async () => {
    try {
      const [studentsRes, overviewRes] = await Promise.all([
        api.get("/api/students", { params: { active: "true" } }),
        api.get("/api/dashboard/overview"),
      ]);
      setStudents(studentsRes.data.students);
      setOverview(overviewRes.data);
    } catch {
      setOverview({
        activeCount: 0,
        limit: 50,
        feeStats: {
          pending: 0,
          overdue: 0,
          paid: 0,
          totalDue: 0,
          totalPaid: 0,
        },
        attendancePercent: 0,
        overdueFees: [],
      });
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (!selectedStudentId) return;
    api
      .get(`/api/scores/student/${selectedStudentId}`)
      .then((res) => {
        setHistory(res.data.history);
        setHistoryStudent(res.data.student);
      })
      .catch(() => {
        setHistory({});
        setHistoryStudent(null);
      });
  }, [selectedStudentId]);

  const progress = Math.min(
    100,
    Math.round((overview.activeCount / overview.limit) * 100),
  );
  const paidProgress = overview.feeStats.totalDue
    ? Math.round(
        (overview.feeStats.totalPaid / overview.feeStats.totalDue) * 100,
      )
    : 0;

  return (
    <div className="p-8">
      <div className="rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-700 via-fuchsia-700 to-orange-500 p-8 text-white shadow-[0_25px_70px_-20px_rgba(109,40,217,0.55)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-100">
              Owner dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              Welcome back, {user?.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-50">
              Keep a pulse on student growth, fee collection, and the day&apos;s
              overall momentum in one place.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-sm text-brand-100">Today&apos;s attendance</p>
            <p className="mt-1 text-2xl font-semibold">
              {overview.attendancePercent}%
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-4">
        <InfoCard
          title="Active students"
          value={overview.activeCount}
          subtitle={`Free plan limit ${overview.limit}`}
          accent="from-violet-600 to-violet-700"
        />
        <InfoCard
          title="This month collected"
          value={formatCurrency(overview.feeStats.totalPaid)}
          subtitle={`${overview.feeStats.paid} paid records`}
          accent="from-teal-500 to-cyan-600"
        />
        <InfoCard
          title="Pending fees"
          value={overview.feeStats.pending}
          subtitle={`${overview.feeStats.overdue} overdue`}
          accent="from-amber-500 to-orange-500"
        />
        <InfoCard
          title="Overdue dues"
          value={overview.overdueFees.length}
          subtitle="Need follow-up today"
          accent="from-rose-500 to-pink-600"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Student capacity
              </h2>
              <p className="text-sm text-gray-500">
                Track how close the center is to the free plan limit.
              </p>
            </div>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700">
              {overview.activeCount}/{overview.limit}
            </span>
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Used capacity</span>
              <span className="font-medium text-gray-900">{progress}%</span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-gray-100">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-900">Plan gating</p>
            <p className="mt-1">
              The free plan currently supports up to {overview.limit} active
              students. A growth plan can be requested when you’re ready to
              scale.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Fee collection
              </h2>
              <p className="text-sm text-gray-500">
                Monthly dues paid vs still pending.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
              {paidProgress}% collected
            </span>
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Collected</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(overview.feeStats.totalPaid)}
              </span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-gray-100">
              <div
                className="mt-2 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-600"
                style={{ width: `${paidProgress}%` }}
              />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>Pending balance</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(
                  Math.max(
                    0,
                    overview.feeStats.totalDue - overview.feeStats.totalPaid,
                  ),
                )}
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Overdue fees
              </h2>
              <p className="text-sm text-gray-500">
                Students that need a follow-up today.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {overview.overdueFees.length > 0 ? (
              overview.overdueFees.map((fee) => (
                <div
                  key={fee._id}
                  className="rounded-2xl border border-rose-100 bg-rose-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {fee.studentName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {fee.parentName} · {fee.batch}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-rose-700">
                      {formatCurrency(fee.amountDue - fee.amountPaid)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                    <span>Due {formatDate(fee.dueDate)}</span>
                    <span>{fee.parentPhone || "No phone on file"}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                No overdue fees right now. Great work.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Score trends
              </h2>
              <p className="text-sm text-gray-500">
                Inspect a student&apos;s learning growth by subject.
              </p>
            </div>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 sm:w-64"
            >
              <option value="">Select a student</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} — {s.batch}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            {selectedStudentId ? (
              <ScoreTrendChart
                history={history}
                title={
                  historyStudent
                    ? `${historyStudent.name}'s progress`
                    : "Score trends"
                }
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500">
                Select a student to see their score trend in a lovely, visual
                layout.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoCard({ title, value, subtitle, accent }) {
  return (
    <div
      className={`rounded-3xl border border-white/40 bg-gradient-to-br ${accent} p-5 text-white shadow-sm`}
    >
      <p className="text-sm font-medium text-white/80">{title}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-white/80">{subtitle}</p>
    </div>
  );
}
