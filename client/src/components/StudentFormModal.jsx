import { useState, useEffect } from 'react';

const emptyForm = {
  name: '',
  parentName: '',
  parentPhone: '',
  studentPhone: '',
  batch: '',
  subjects: '',
  feeAmount: '',
  feeFrequency: 'monthly',
  joinDate: new Date().toISOString().slice(0, 10),
};

function studentToForm(student) {
  if (!student) return emptyForm;
  return {
    name: student.name,
    parentName: student.parentName,
    parentPhone: student.parentPhone,
    studentPhone: student.studentPhone || '',
    batch: student.batch,
    subjects: (student.subjects || []).join(', '),
    feeAmount: String(student.feeAmount),
    feeFrequency: student.feeFrequency,
    joinDate: student.joinDate.slice(0, 10),
  };
}

export default function StudentFormModal({ open, onClose, onSubmit, student, submitting, error }) {
  const [form, setForm] = useState(emptyForm);
  const isEdit = Boolean(student);

  useEffect(() => {
    if (open) setForm(studentToForm(student));
  }, [open, student]);

  if (!open) return null;

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: form.name.trim(),
      parentName: form.parentName.trim(),
      parentPhone: form.parentPhone.trim(),
      studentPhone: form.studentPhone.trim(),
      batch: form.batch.trim(),
      subjects: form.subjects
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      feeAmount: Number(form.feeAmount),
      feeFrequency: form.feeFrequency,
      joinDate: form.joinDate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEdit ? 'Edit student' : 'Add student'}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Student name" value={form.name} onChange={update('name')} required />
            <Field label="Batch" value={form.batch} onChange={update('batch')} placeholder="Class 10 - Morning" required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Parent name" value={form.parentName} onChange={update('parentName')} required />
            <Field label="Parent phone" value={form.parentPhone} onChange={update('parentPhone')} placeholder="+91 9876543210" required />
          </div>

          <Field label="Student phone (optional)" value={form.studentPhone} onChange={update('studentPhone')} />

          <Field label="Subjects" value={form.subjects} onChange={update('subjects')} placeholder="Math, Physics" />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fee amount (₹)" type="number" min="0" value={form.feeAmount} onChange={update('feeAmount')} required />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Fee frequency</label>
              <select
                value={form.feeFrequency}
                onChange={update('feeFrequency')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="monthly">Monthly</option>
                <option value="one-time">One-time</option>
              </select>
            </div>
          </div>

          <Field label="Join date" type="date" value={form.joinDate} onChange={update('joinDate')} required />

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required, placeholder, min }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        min={min}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />
    </div>
  );
}
