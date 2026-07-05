import Student from '../models/Student.js';
import FeeRecord from '../models/FeeRecord.js';
import { applyFeeStatus } from '../utils/feeStatus.js';

export function getCurrentMonth(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getDueDateForMonth(month) {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon - 1, 10);
}

/**
 * Creates FeeRecords for the given month for every active monthly student.
 * Skips students who already have a record for that month.
 * Pass centerId to scope to one tenant; omit to run across all centers (cron).
 */
export async function generateMonthlyFees({ centerId, month = getCurrentMonth() } = {}) {
  const studentFilter = { active: true, feeFrequency: 'monthly' };
  if (centerId) studentFilter.centerId = centerId;

  const students = await Student.find(studentFilter);
  const dueDate = getDueDateForMonth(month);
  const created = [];
  const skipped = [];

  for (const student of students) {
    const exists = await FeeRecord.findOne({
      centerId: student.centerId,
      studentId: student._id,
      month,
    });

    if (exists) {
      skipped.push(exists);
      continue;
    }

    const record = new FeeRecord({
      centerId: student.centerId,
      studentId: student._id,
      month,
      amountDue: student.feeAmount,
      amountPaid: 0,
      dueDate,
      status: 'pending',
    });

    applyFeeStatus(record);
    await record.save();
    created.push(record);
  }

  return { month, created: created.length, skipped: skipped.length, total: students.length };
}
