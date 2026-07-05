import { Router } from 'express';
import mongoose from 'mongoose';
import FeeRecord from '../models/FeeRecord.js';
import { authMiddleware } from '../middleware/auth.js';
import { refreshFeeStatuses } from '../utils/feeStatus.js';
import { generateMonthlyFees, getCurrentMonth } from '../services/feeGeneration.js';
import {
  buildWhatsAppReminderLink,
  buildFeeReminderMessage,
  formatMonthLabel,
  formatDateLabel,
} from '../utils/whatsapp.js';

const router = Router();

router.use(authMiddleware);

function attachReminderLink(record, centerName) {
  if (!record.studentId || record.status === 'paid') return record;

  const student = record.studentId;
  const message = buildFeeReminderMessage({
    parentName: student.parentName,
    studentName: student.name,
    centerName,
    amountDue: record.amountDue - record.amountPaid,
    monthLabel: formatMonthLabel(record.month),
    dueDateLabel: formatDateLabel(record.dueDate),
  });

  const plain = record.toObject ? record.toObject() : { ...record };
  plain.reminderLink = buildWhatsAppReminderLink(student.parentPhone, message);
  return plain;
}

router.get('/', async (req, res) => {
  try {
    const { centerId, centerName } = req.user;
    const { month = getCurrentMonth(), status } = req.query;

    await refreshFeeStatuses(FeeRecord, { centerId, month });

    const filter = { centerId, month };
    if (status) {
      const statuses = status.split(',').map((s) => s.trim());
      filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }

    const records = await FeeRecord.find(filter)
      .populate('studentId', 'name parentName parentPhone batch feeAmount')
      .sort({ dueDate: 1 });

    const summary = await FeeRecord.aggregate([
      { $match: { centerId: new mongoose.Types.ObjectId(centerId), month } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalDue: { $sum: '$amountDue' }, totalPaid: { $sum: '$amountPaid' } } },
    ]);

    const stats = { paid: 0, pending: 0, overdue: 0, totalDue: 0, totalPaid: 0 };
    for (const row of summary) {
      stats[row._id] = row.count;
      stats.totalDue += row.totalDue;
      stats.totalPaid += row.totalPaid;
    }

    res.json({
      month,
      records: records.map((r) => attachReminderLink(r, centerName)),
      stats,
    });
  } catch (err) {
    console.error('List fees error:', err);
    res.status(500).json({ message: 'Failed to fetch fee records' });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const month = req.body.month || getCurrentMonth();
    const result = await generateMonthlyFees({ centerId: req.user.centerId, month });
    res.json({ message: `Generated ${result.created} fee records for ${month}`, ...result });
  } catch (err) {
    console.error('Generate fees error:', err);
    res.status(500).json({ message: 'Failed to generate fee records' });
  }
});

router.patch('/:id/pay', async (req, res) => {
  try {
    const record = await FeeRecord.findOne({ _id: req.params.id, centerId: req.user.centerId }).populate(
      'studentId',
      'name parentName parentPhone'
    );

    if (!record) return res.status(404).json({ message: 'Fee record not found' });
    if (record.status === 'paid') return res.status(400).json({ message: 'Already marked as paid' });

    record.amountPaid = record.amountDue;
    record.paidDate = new Date();
    record.status = 'paid';
    await record.save();

    res.json({ record: attachReminderLink(record, req.user.centerName) });
  } catch (err) {
    console.error('Mark paid error:', err);
    res.status(500).json({ message: 'Failed to mark fee as paid' });
  }
});

export default router;
