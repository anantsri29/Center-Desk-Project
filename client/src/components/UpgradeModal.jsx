export default function UpgradeModal({ open, onClose, limit, current }) {
  if (!open) return null;

  const handleUpgradeClick = () => {
    console.log('[upgrade-intent]', { source: 'students_page', timestamp: new Date().toISOString() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Student limit reached</h2>
        <p className="mt-2 text-sm text-gray-600">
          Your free plan allows up to {limit} active students. You currently have {current} active
          students. Upgrade to add more students and unlock unlimited capacity.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Maybe later
          </button>
          <button
            onClick={handleUpgradeClick}
            className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Upgrade plan
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-gray-400">
          Payments coming soon — we&apos;ll notify you when upgrades are available.
        </p>
      </div>
    </div>
  );
}
