import { Router } from 'express';
import crypto from 'crypto';
import TestScore from '../models/TestScore.js';
import Student from '../models/Student.js';
import { authMiddleware } from '../middleware/auth.js';
import { formatScoreForChart, groupScoresBySubject } from '../utils/scores.js';

const router = Router();

router.use(authMiddleware);

async function getStudentInCenter(studentId, centerId) {
  return Student.findOne({ _id: studentId, centerId });
}

router.get('/', async (req, res) => {
  try {
    const { centerId } = req.user;
    const { batch, testName, subject, studentId } = req.query;

    const filter = { centerId };
    if (testName) filter.testName = new RegExp(testName, 'i');
    if (subject) filter.subject = subject;
    if (studentId) filter.studentId = studentId;

    let scores = await TestScore.find(filter)
      .populate('studentId', 'name batch subjects')
      .sort({ date: -1 });

    if (batch) {
      scores = scores.filter((s) => s.studentId?.batch === batch);
    }

    res.json({ scores });
  } catch (err) {
    console.error('List scores error:', err);
    res.status(500).json({ message: 'Failed to fetch scores' });
  }
});

router.get('/student/:id', async (req, res) => {
  try {
    const { centerId } = req.user;
    const student = await getStudentInCenter(req.params.id, centerId);

    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (!student.portalToken) {
      student.portalToken = crypto.randomBytes(16).toString('hex');
      await student.save();
    }

    const scores = await TestScore.find({ centerId, studentId: student._id }).sort({ date: 1 });
    const history = groupScoresBySubject(scores);

    res.json({
      student: {
        id: student._id.toString(),
        name: student.name,
        batch: student.batch,
        subjects: student.subjects,
        portalToken: student.portalToken,
      },
      scores: scores.map(formatScoreForChart),
      history,
    });
  } catch (err) {
    console.error('Student score history error:', err);
    res.status(500).json({ message: 'Failed to fetch score history' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { centerId } = req.user;
    const { studentId, subject, testName, marksObtained, totalMarks, date } = req.body;

    if (!studentId || !subject || !testName || marksObtained == null || !totalMarks || !date) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (marksObtained > totalMarks) {
      return res.status(400).json({ message: 'Marks obtained cannot exceed total marks' });
    }

    const student = await getStudentInCenter(studentId, centerId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const score = await TestScore.create({
      centerId,
      studentId,
      subject,
      testName,
      marksObtained,
      totalMarks,
      date,
    });

    await score.populate('studentId', 'name batch');
    res.status(201).json({ score });
  } catch (err) {
    console.error('Create score error:', err);
    res.status(500).json({ message: 'Failed to create score' });
  }
});

router.post('/bulk', async (req, res) => {
  try {
    const { centerId } = req.user;
    const { batch, subject, testName, totalMarks, date, scores } = req.body;

    if (!batch || !subject || !testName || !totalMarks || !date || !Array.isArray(scores)) {
      return res.status(400).json({ message: 'batch, subject, testName, totalMarks, date, and scores[] are required' });
    }

    const students = await Student.find({ centerId, batch, active: true });
    const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

    const created = [];
    const errors = [];

    for (const entry of scores) {
      const { studentId, marksObtained } = entry;
      if (marksObtained == null || marksObtained === '') continue;

      const student = studentMap.get(studentId);
      if (!student) {
        errors.push({ studentId, message: 'Student not in batch' });
        continue;
      }

      if (marksObtained > totalMarks) {
        errors.push({ studentId, message: 'Marks exceed total' });
        continue;
      }

      const score = await TestScore.create({
        centerId,
        studentId,
        subject,
        testName,
        marksObtained: Number(marksObtained),
        totalMarks,
        date,
      });

      created.push(score);
    }

    res.status(201).json({
      created: created.length,
      errors,
      message: `Saved ${created.length} score${created.length === 1 ? '' : 's'}`,
    });
  } catch (err) {
    console.error('Bulk create scores error:', err);
    res.status(500).json({ message: 'Failed to save bulk scores' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { centerId } = req.user;
    const score = await TestScore.findOne({ _id: req.params.id, centerId });

    if (!score) return res.status(404).json({ message: 'Score not found' });

    const fields = ['subject', 'testName', 'marksObtained', 'totalMarks', 'date'];
    for (const field of fields) {
      if (req.body[field] !== undefined) score[field] = req.body[field];
    }

    if (score.marksObtained > score.totalMarks) {
      return res.status(400).json({ message: 'Marks obtained cannot exceed total marks' });
    }

    await score.save();
    await score.populate('studentId', 'name batch');
    res.json({ score });
  } catch (err) {
    console.error('Update score error:', err);
    res.status(500).json({ message: 'Failed to update score' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const score = await TestScore.findOneAndDelete({ _id: req.params.id, centerId: req.user.centerId });
    if (!score) return res.status(404).json({ message: 'Score not found' });
    res.json({ message: 'Score deleted' });
  } catch (err) {
    console.error('Delete score error:', err);
    res.status(500).json({ message: 'Failed to delete score' });
  }
});

export default router;
