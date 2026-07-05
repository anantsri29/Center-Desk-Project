import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

export default function ScoreTrendChart({ history, title = 'Score trends' }) {
  const subjects = Object.keys(history || {}).filter((s) => history[s]?.length > 0);

  if (subjects.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        No score history yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <div className="grid gap-6 lg:grid-cols-2">
        {subjects.map((subject, i) => {
          const data = history[subject].map((point) => ({
            label: `${point.testName} (${point.dateLabel})`,
            percentage: point.percentage,
            testName: point.testName,
          }));

          return (
            <div key={subject} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-medium text-gray-700">{subject}</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="testName"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Score']}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.label}
                  />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
