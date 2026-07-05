export const FREE_PLAN_STUDENT_LIMIT = 50;

export function getStudentLimit(plan) {
  if (plan === 'paid') return Infinity;
  return FREE_PLAN_STUDENT_LIMIT;
}

export async function getActiveStudentCount(Student, centerId) {
  return Student.countDocuments({ centerId, active: true });
}

export async function checkCanAddActiveStudent(Student, centerId, plan) {
  const limit = getStudentLimit(plan);
  if (limit === Infinity) return { allowed: true, count: 0, limit };

  const count = await getActiveStudentCount(Student, centerId);
  return { allowed: count < limit, count, limit };
}
