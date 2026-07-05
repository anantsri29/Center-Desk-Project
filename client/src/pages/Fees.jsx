import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(month) {
  const [year, mon] = month.split('-');
  return new Date(Number(year), Number(mon) - 1, 1).toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const statusTabs = [
  { key: 'pending,overdue', label: 'Pending & overdue' },
  { key: 'pending', label: 'Pending' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'paid', label: 'Paid' },
  { key: '', label: 'All' },
];

const statusStyles = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
};

export default function Fees() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [statusFilter, setStatusFilter] = useState('pending,overdue');
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ paid: 0, pending: 0, overdue: 0, totalDue: 0, totalPaid: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [payingId, setPayingId] = useState(null);

  const fetchFees = useCallback(async () => {
    setLoading(true);
    try {
      const params = { month };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/api/fees', { params });
      setRecords(data.records);
      setStats(data.stats);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [month, statusFilter]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/api/fees/generate', { month });
      alert(data.message);
      fetchFees();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate fees');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (id) => {
    setPayingId(id);
    try {
      await api.patch(`/api/fees/${id}/pay`);
      fetchFees();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark as paid');
    } finally {
      setPayingId(null);
    }
  };

  const outstanding = stats.totalDue - stats.totalPaid;

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees</h1>
          <p className="mt-1 text-sm text-gray-500">{formatMonthLabel(month)}</p>
        </div>
        <div className="flex gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'Generate fees'}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Pending" value={stats.pending ?? 0} />
        <StatCard label="Overdue" value={stats.overdue ?? 0} accent="text-red-600" />
        <StatCard label="Paid" value={stats.paid ?? 0} accent="text-green-600" />
        <StatCard
          label="Outstanding"
          value={`₹${Math.max(0, outstanding).toLocaleString('en-IN')}`}
          accent="text-amber-600"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {statusTabs.map(({ key, label }) => (
          <button
            key={key || 'all'}
            onClick={() => setStatusFilter(key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === key
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500">No fee records for this period.</p>
            <button
              onClick={handleGenerate}
              className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Generate fees for {formatMonthLabel(month)}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Parent</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Due date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((record) => {
                  const student = record.studentId;
                  const balance = record.amountDue - record.amountPaid;
                  return (
                    <tr key={record._id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{student?.name}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{student?.parentName}</div>
                        <div className="text-xs text-gray-400">{student?.parentPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        ₹{record.amountDue.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        ₹{record.amountPaid.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(record.dueDate)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[record.status]}`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {record.status !== 'paid' && (
                            <>
                              <button
                                onClick={() => handleMarkPaid(record._id)}
                                disabled={payingId === record._id}
                                className="text-brand-600 hover:text-brand-700 disabled:opacity-50"
                              >
                                {payingId === record._id ? 'Saving…' : 'Mark paid'}
                              </button>
                              {record.reminderLink && (
                                <a
                                  href={record.reminderLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
                                >
                                  Send reminder
                                </a>
                              )}
                            </>
                          )}
                          {record.status === 'paid' && record.paidDate && (
                            <span className="text-xs text-gray-400">
                              Paid {formatDate(record.paidDate)}
                            </span>
                          )}
                          {record.status !== 'paid' && balance > 0 && (
                            <span className="text-xs text-gray-400">
                              ₹{balance.toLocaleString('en-IN')} due
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Reminders open WhatsApp with a pre-filled message — tap send in WhatsApp to deliver.
      </p>
    </div>
  );
}

function StatCard({ label, value, accent = 'text-gray-900' }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}
