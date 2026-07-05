export function computeFeeStatus(record, now = new Date()) {
  if (record.amountPaid >= record.amountDue) return 'paid';
  if (now > new Date(record.dueDate)) return 'overdue';
  return 'pending';
}

export function applyFeeStatus(record, now = new Date()) {
  record.status = computeFeeStatus(record, now);
  return record;
}

export async function refreshFeeStatuses(FeeRecord, filter) {
  const records = await FeeRecord.find({
    ...filter,
    status: { $ne: 'paid' },
  });

  const now = new Date();
  const updates = [];

  for (const record of records) {
    const next = computeFeeStatus(record, now);
    if (next !== record.status) {
      record.status = next;
      updates.push(record.save());
    }
  }

  await Promise.all(updates);
}
