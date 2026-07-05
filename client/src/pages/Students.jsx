import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StudentFormModal from "../components/StudentFormModal";
import UpgradeModal from "../components/UpgradeModal";

export default function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState({ limit: 50, current: 50 });
  const [shareStudent, setShareStudent] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (batchFilter) params.batch = batchFilter;
      params.active = showInactive ? undefined : "true";

      const { data } = await api.get("/api/students", { params });
      setStudents(data.students);
      setBatches(data.batches);
      setActiveCount(data.activeCount);
      if (data.limit != null) setLimit(data.limit);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [search, batchFilter, showInactive]);

  useEffect(() => {
    const timer = setTimeout(fetchStudents, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchStudents, search]);

  const openAdd = () => {
    setEditingStudent(null);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (student) => {
    setEditingStudent(student);
    setFormError("");
    setModalOpen(true);
  };

  const handlePlanLimit = (err) => {
    const data = err.response?.data;
    if (err.response?.status === 402) {
      setUpgradeInfo({
        limit: data.limit ?? 50,
        current: data.current ?? activeCount,
      });
      setUpgradeOpen(true);
      setModalOpen(false);
      return true;
    }
    return false;
  };

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setFormError("");
    try {
      if (editingStudent) {
        await api.put(`/api/students/${editingStudent._id}`, formData);
      } else {
        await api.post("/api/students", formData);
      }
      setModalOpen(false);
      fetchStudents();
    } catch (err) {
      if (!handlePlanLimit(err)) {
        setFormError(err.response?.data?.message || "Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (student) => {
    if (!window.confirm(`Mark ${student.name} as inactive?`)) return;
    try {
      await api.delete(`/api/students/${student._id}`);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to deactivate student");
    }
  };

  const openShare = (student) => {
    setShareStudent(student);
  };

  const shareLink = shareStudent?.portalToken
    ? `${window.location.origin}/parent/${shareStudent._id}/${shareStudent.portalToken}`
    : "";

  const copyShareLink = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    alert("Portal link copied");
  };

  const shareOnWhatsApp = () => {
    if (!shareLink) return;
    const message = encodeURIComponent(
      `Parent portal for ${shareStudent?.name}: ${shareLink}`,
    );
    window.open(
      `https://wa.me/?text=${message}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleReactivate = async (student) => {
    try {
      await api.put(`/api/students/${student._id}`, { active: true });
      fetchStudents();
    } catch (err) {
      if (!handlePlanLimit(err)) {
        alert(err.response?.data?.message || "Failed to reactivate student");
      }
    }
  };

  const atLimit = user?.plan === "free" && activeCount >= limit;

  return (
    <div className="rounded-[2rem] border border-gray-200/80 bg-white/80 p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] backdrop-blur xl:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">
            Student management
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">
            Students
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {user?.plan === "free" ? (
              <>
                {activeCount} / {limit} active students on free plan
              </>
            ) : (
              <>{activeCount} active students</>
            )}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:translate-y-[-1px]"
        >
          + Add student
        </button>
      </div>

      {atLimit && (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            You&apos;ve reached the free plan limit of {limit} active students.
          </p>
          <button
            onClick={() => {
              setUpgradeInfo({ limit, current: activeCount });
              setUpgradeOpen(true);
            }}
            className="text-sm font-medium text-amber-900 underline hover:no-underline"
          >
            Upgrade
          </button>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search by name, parent, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        />
        <select
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        >
          <option value="">All batches</option>
          {batches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-gray-300"
          />
          Show inactive
        </label>
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          </div>
        ) : students.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">
            No students found. Add your first student to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3">Parent</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Subjects</th>
                  <th className="px-4 py-3">Fee</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student) => (
                  <tr
                    key={student._id}
                    className={!student.active ? "bg-gray-50 opacity-75" : ""}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{student.batch}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {student.parentName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {student.parentPhone}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {(student.subjects || []).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      ₹{student.feeAmount.toLocaleString("en-IN")}
                      <span className="ml-1 text-xs text-gray-400">
                        {student.feeFrequency === "monthly" ? "/mo" : " once"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          student.active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {student.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(student)}
                          className="text-brand-600 hover:text-brand-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openShare(student)}
                          className="text-sky-600 hover:text-sky-700"
                        >
                          Share
                        </button>
                        {student.active ? (
                          <button
                            onClick={() => handleDeactivate(student)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(student)}
                            className="text-green-600 hover:text-green-700"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StudentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        student={editingStudent}
        submitting={submitting}
        error={formError}
      />

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        limit={upgradeInfo.limit}
        current={upgradeInfo.current}
      />

      {shareStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Parent portal link
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {shareStudent.name} · {shareStudent.batch}
                </p>
              </div>
              <button
                onClick={() => setShareStudent(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="mt-5 flex justify-center rounded-lg border border-gray-200 bg-gray-50 p-4">
              <QRCodeSVG value={shareLink} size={180} level="H" includeMargin />
            </div>

            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Shareable link
              </p>
              <p className="mt-1 break-all text-sm text-gray-700">
                {shareLink}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={copyShareLink}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Copy link
              </button>
              <button
                onClick={shareOnWhatsApp}
                className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Share on WhatsApp
              </button>
              <button
                onClick={() => window.print()}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
