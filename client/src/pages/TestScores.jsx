import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import ScoreTrendChart from "../components/ScoreTrendChart";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function TestScores() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [bulk, setBulk] = useState({
    batch: "",
    subject: "",
    testName: "",
    totalMarks: "100",
    date: todayISO(),
  });
  const [bulkMarks, setBulkMarks] = useState({});
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [history, setHistory] = useState({});
  const [historyStudent, setHistoryStudent] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchMeta = useCallback(async () => {
    try {
      const { data } = await api.get("/api/students", {
        params: { active: "true" },
      });
      setBatches(data.batches);
      setStudents(data.students);
      setBulk((b) => (b.batch ? b : { ...b, batch: data.batches[0] || "" }));
    } catch {
      setBatches([]);
      setStudents([]);
    }
  }, []);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/scores");
      setScores(data.scores);
    } catch {
      setScores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeta();
    fetchScores();
  }, [fetchMeta, fetchScores]);

  useEffect(() => {
    const marks = {};
    for (const s of students.filter((st) => st.batch === bulk.batch)) {
      marks[s._id] = "";
    }
    setBulkMarks(marks);
  }, [bulk.batch, students]);

  const batchStudents = students.filter((s) => s.batch === bulk.batch);

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setBulkSubmitting(true);
    setBulkMessage("");
    try {
      const scoresPayload = Object.entries(bulkMarks)
        .filter(([, v]) => v !== "" && v != null)
        .map(([studentId, marksObtained]) => ({
          studentId,
          marksObtained: Number(marksObtained),
        }));

      if (scoresPayload.length === 0) {
        setBulkMessage("Enter marks for at least one student.");
        return;
      }

      const { data } = await api.post("/api/scores/bulk", {
        ...bulk,
        totalMarks: Number(bulk.totalMarks),
        scores: scoresPayload,
      });

      setBulkMessage(data.message);
      setBulkMarks({});
      fetchScores();
      if (selectedStudentId) loadHistory(selectedStudentId);
    } catch (err) {
      setBulkMessage(err.response?.data?.message || "Failed to save scores");
    } finally {
      setBulkSubmitting(false);
    }
  };

  const loadHistory = async (studentId) => {
    if (!studentId) return;
    setHistoryLoading(true);
    try {
      const { data } = await api.get(`/api/scores/student/${studentId}`);
      setHistory(data.history);
      setHistoryStudent(data.student);
    } catch {
      setHistory({});
      setHistoryStudent(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudentId) loadHistory(selectedStudentId);
  }, [selectedStudentId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this score record?")) return;
    try {
      await api.delete(`/api/scores/${id}`);
      fetchScores();
      if (selectedStudentId) loadHistory(selectedStudentId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const portalUrl =
    historyStudent?.portalToken && historyStudent?.id
      ? `${window.location.origin}/parent/${historyStudent.id}/${historyStudent.portalToken}`
      : null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Test Scores</h1>
      <p className="mt-1 text-sm text-gray-500">
        Enter batch scores and track trends over time.
      </p>

      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Bulk entry</h2>
        <p className="mt-1 text-sm text-gray-500">
          Record one test for an entire batch at once.
        </p>

        <form onSubmit={handleBulkSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Batch">
              <select
                value={bulk.batch}
                onChange={(e) =>
                  setBulk((b) => ({ ...b, batch: e.target.value }))
                }
                className={inputClass}
                required
              >
                <option value="">Select batch</option>
                {batches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Subject">
              <input
                value={bulk.subject}
                onChange={(e) =>
                  setBulk((b) => ({ ...b, subject: e.target.value }))
                }
                className={inputClass}
                placeholder="Math"
                required
              />
            </Field>
            <Field label="Test name">
              <input
                value={bulk.testName}
                onChange={(e) =>
                  setBulk((b) => ({ ...b, testName: e.target.value }))
                }
                className={inputClass}
                placeholder="Unit Test 1"
                required
              />
            </Field>
            <Field label="Total marks">
              <input
                type="number"
                min="1"
                value={bulk.totalMarks}
                onChange={(e) =>
                  setBulk((b) => ({ ...b, totalMarks: e.target.value }))
                }
                className={inputClass}
                required
              />
            </Field>
            <Field label="Date">
              <input
                type="date"
                value={bulk.date}
                onChange={(e) =>
                  setBulk((b) => ({ ...b, date: e.target.value }))
                }
                className={inputClass}
                required
              />
            </Field>
          </div>

          {bulk.batch && (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2">Student</th>
                    <th className="px-4 py-2 w-32">Marks obtained</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {batchStudents.map((s) => (
                    <tr key={s._id}>
                      <td className="px-4 py-2 font-medium text-gray-900">
                        {s.name}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          max={bulk.totalMarks}
                          value={bulkMarks[s._id] ?? ""}
                          onChange={(e) =>
                            setBulkMarks((m) => ({
                              ...m,
                              [s._id]: e.target.value,
                            }))
                          }
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                          placeholder="—"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {bulkMessage && (
            <p className="text-sm text-gray-600">{bulkMessage}</p>
          )}

          <button
            type="submit"
            disabled={bulkSubmitting || !bulk.batch}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {bulkSubmitting ? "Saving…" : "Save scores"}
          </button>
        </form>
      </section>

      <section className="mt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Student trends
            </h2>
            <p className="text-sm text-gray-500">
              Percentage over time, per subject.
            </p>
          </div>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className={`${inputClass} sm:w-64`}
          >
            <option value="">Select a student</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} — {s.batch}
              </option>
            ))}
          </select>
        </div>

        {portalUrl && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-brand-50 px-4 py-2 text-sm">
            <span className="text-brand-800">Parent portal link:</span>
            <code className="truncate text-xs text-brand-700">{portalUrl}</code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(portalUrl)}
              className="rounded border border-brand-200 px-2 py-0.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
            >
              Copy
            </button>
          </div>
        )}

        <div className="mt-4">
          {historyLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
            </div>
          ) : selectedStudentId ? (
            <ScoreTrendChart
              history={history}
              title={
                historyStudent
                  ? `${historyStudent.name}'s progress`
                  : "Score trends"
              }
            />
          ) : (
            <p className="text-sm text-gray-500">
              Select a student to view their score trends.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Recent scores</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
            </div>
          ) : scores.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              No scores recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Test</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scores.map((score) => {
                    const pct =
                      Math.round(
                        (score.marksObtained / score.totalMarks) * 1000,
                      ) / 10;
                    return (
                      <tr key={score._id}>
                        <td className="px-4 py-3 font-medium">
                          {score.studentId?.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {score.testName}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {score.subject}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {score.marksObtained}/{score.totalMarks}{" "}
                          <span className="text-xs text-gray-400">
                            ({pct}%)
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(score.date).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(score._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}
