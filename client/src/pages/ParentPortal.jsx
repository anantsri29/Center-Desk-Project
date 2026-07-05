import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ScoreTrendChart from "../components/ScoreTrendChart";

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

export default function ParentPortal() {
  const { studentId, accessToken } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    publicApi
      .get(`/api/parent/${studentId}/${accessToken}`)
      .then((res) => setData(res.data))
      .catch(() =>
        setError(
          "This link is invalid or the student record is no longer active.",
        ),
      )
      .finally(() => setLoading(false));
  }, [studentId, accessToken]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">
            Unable to load portal
          </h1>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const { student, center, history, scores, feeSummary, attendanceSummary } =
    data;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <p className="text-sm font-medium text-brand-600">{center.name}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            {student.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {student.batch} · Parent: {student.parentName}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Attendance"
            value={attendanceSummary.recordedDays}
            subtitle={attendanceSummary.status}
          />
          <SummaryCard
            title="Fee status"
            value={
              feeSummary?.status ? feeSummary.status.toUpperCase() : "NONE"
            }
            subtitle={feeSummary?.balanceLabel || "No fee records yet"}
          />
          <SummaryCard
            title="Latest test"
            value={
              scores.length > 0
                ? `${scores[scores.length - 1].percentage}%`
                : "—"
            }
            subtitle={
              scores.length > 0
                ? scores[scores.length - 1].subject
                : "No scores yet"
            }
          />
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Attendance summary
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {attendanceSummary.status}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric
              label="Recorded days"
              value={attendanceSummary.recordedDays}
            />
            <Metric label="Present" value={attendanceSummary.presentDays} />
            <Metric label="Absent" value={attendanceSummary.absentDays} />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Fee status</h2>
            <p className="mt-2 text-sm text-gray-500">
              {feeSummary?.summary || "No fee records yet."}
            </p>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="font-medium text-gray-900">
                  {feeSummary?.status || "None"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Amount due</span>
                <span className="font-medium text-gray-900">
                  ₹{feeSummary?.amountDue?.toLocaleString("en-IN") || "0"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Amount paid</span>
                <span className="font-medium text-gray-900">
                  ₹{feeSummary?.amountPaid?.toLocaleString("en-IN") || "0"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Score trend</h2>
            <p className="mt-2 text-sm text-gray-500">
              Performance over time for this student.
            </p>
            <div className="mt-4">
              <ScoreTrendChart history={history} title="Test score trends" />
            </div>
          </div>
        </div>

        {scores.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">
              All test results
            </h2>
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Test</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...scores].reverse().map((score) => (
                    <tr key={score.id}>
                      <td className="px-4 py-3 text-gray-600">
                        {score.dateLabel}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {score.testName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {score.subject}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {score.marksObtained}/{score.totalMarks}{" "}
                        <span className="text-xs text-gray-400">
                          ({score.percentage}%)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <p className="mt-8 text-center text-xs text-gray-400">
          Read-only parent view · Powered by CenterDesk
        </p>
      </main>
    </div>
  );
}

function SummaryCard({ title, value, subtitle }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
