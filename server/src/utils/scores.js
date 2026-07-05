export function toPercentage(marksObtained, totalMarks) {
  if (!totalMarks) return 0;
  return Math.round((marksObtained / totalMarks) * 1000) / 10;
}

export function formatScoreForChart(score) {
  return {
    id: score._id.toString(),
    subject: score.subject,
    testName: score.testName,
    marksObtained: score.marksObtained,
    totalMarks: score.totalMarks,
    percentage: toPercentage(score.marksObtained, score.totalMarks),
    date: score.date,
    dateLabel: new Date(score.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  };
}

export function groupScoresBySubject(scores) {
  const history = {};

  for (const score of scores) {
    const formatted = formatScoreForChart(score);
    if (!history[formatted.subject]) history[formatted.subject] = [];
    history[formatted.subject].push(formatted);
  }

  for (const subject of Object.keys(history)) {
    history[subject].sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  return history;
}
