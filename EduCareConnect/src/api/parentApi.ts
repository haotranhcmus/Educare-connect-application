import { callKw, searchCount, searchRead } from "./odooClient";

// ── Fetch parent's student (first child, backward-compat) ─────
export async function fetchMyStudent(uid: number) {
  const result = await searchRead<any>(
    "educare.student",
    [["parent_user_id", "=", uid]],
    [
      "name",
      "student_code",
      "status",
      "avatar",
      "date_of_birth",
      "age",
      "age_months",
      "gender",
      "school_name",
      "class_name",
      "enrollment_date",
      "primary_diagnosis",
      "assigned_teacher_id",
      "supervisor_id",
      "center_id",
    ],
    { limit: 1 },
  );
  return result[0] || null;
}

// ── Fetch all children of a parent ───────────────────────────
export async function fetchMyStudents(uid: number) {
  return searchRead<any>(
    "educare.student",
    [["parent_user_id", "=", uid]],
    [
      "id",
      "name",
      "student_code",
      "status",
      "avatar",
      "date_of_birth",
      "age",
      "gender",
      "assigned_teacher_id",
      "center_id",
    ],
  );
}

// ── Fetch a single student by ID ─────────────────────────────
export async function fetchStudentById(studentId: number) {
  const result = await searchRead<any>(
    "educare.student",
    [["id", "=", studentId]],
    [
      "id",
      "name",
      "student_code",
      "status",
      "avatar",
      "date_of_birth",
      "age",
      "age_months",
      "gender",
      "school_name",
      "class_name",
      "enrollment_date",
      "primary_diagnosis",
      "assigned_teacher_id",
      "supervisor_id",
      "center_id",
    ],
    { limit: 1 },
  );
  return result[0] || null;
}

// ── Fetch unread report count ─────────────────────────────────
export async function fetchUnreadReportCount(
  studentId: number,
): Promise<number> {
  const result = await searchCount("educare.daily.report", [
    ["student_id", "=", studentId],
    ["status", "=", "sent"],
  ]);
  return result;
}

// ── Fetch active IEP plan with goals ──────────────────────────
export async function fetchActiveIepPlan(studentId: number) {
  const plans = await searchRead<any>(
    "educare.iep.plan",
    [
      ["student_id", "=", studentId],
      ["status", "=", "active"],
    ],
    [
      "id",
      "iep_period",
      "start_date",
      "end_date",
      "status",
      "version_number",
      "supervisor_id",
    ],
    { limit: 1 },
  );
  if (!plans.length) return null;

  const plan = plans[0];
  const goals = await searchRead<any>(
    "educare.iep.goal",
    [["plan_id", "=", plan.id]],
    [
      "id",
      "name",
      "goal_domain_id",
      "progress_pct",
      "status",
      "objective_count",
    ],
  );
  return { ...plan, goals };
}

// ── Fetch latest completed session ────────────────────────────
export async function fetchLatestSession(studentId: number) {
  const result = await searchRead<any>(
    "educare.session.log",
    [
      ["student_id", "=", studentId],
      ["status", "=", "done"],
    ],
    ["id", "session_date", "start_time", "end_time", "location", "status"],
    { limit: 1, order: "session_date desc" },
  );
  return result[0] || null;
}

// ── Fetch all IEP plans (for history) ─────────────────────────
export async function fetchIepPlanHistory(studentId: number) {
  return searchRead<any>(
    "educare.iep.plan",
    [["student_id", "=", studentId]],
    [
      "id",
      "iep_period",
      "start_date",
      "end_date",
      "status",
      "version_number",
      "supervisor_id",
    ],
    { order: "start_date desc" },
  );
}

// ── Fetch goals with objectives for a plan ────────────────────
export async function fetchGoalsWithObjectives(planId: number) {
  const goals = await searchRead<any>(
    "educare.iep.goal",
    [["plan_id", "=", planId]],
    [
      "id",
      "name",
      "goal_domain_id",
      "progress_pct",
      "status",
      "objective_count",
    ],
  );

  // Fetch objectives for each goal
  for (const goal of goals) {
    goal.objectives = await searchRead<any>(
      "educare.iep.objective",
      [["goal_id", "=", goal.id]],
      [
        "id",
        "name",
        "description",
        "baseline_accuracy_pct",
        "current_accuracy_pct",
        "target_accuracy_pct",
        "status",
        "trend",
        "last_session_date",
        "last_session_accuracy",
      ],
    );
  }
  return goals;
}

// ── Count sessions this week ──────────────────────────────────
export async function fetchSessionsThisWeek(
  studentId: number,
): Promise<number> {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const offsetToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - offsetToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return searchCount("educare.session.log", [
    ["student_id", "=", studentId],
    ["session_date", ">=", fmt(monday)],
    ["session_date", "<=", fmt(sunday)],
    ["status", "in", ["completed", "done"]],
  ]);
}

// ── Fetch sessions for timetable (parent view) ───────────────
export async function fetchStudentTimetable(
  studentId: number,
  dateFrom?: string,
  dateTo?: string,
) {
  const domain: any[] = [["student_id", "=", studentId]];
  if (dateFrom) domain.push(["session_date", ">=", dateFrom]);
  if (dateTo) domain.push(["session_date", "<=", dateTo]);
  return searchRead<any>(
    "educare.session.log",
    domain,
    [
      "id",
      "name",
      "session_date",
      "start_time",
      "end_time",
      "duration",
      "location",
      "session_type",
      "session_purpose",
      "status",
      "teacher_id",
      "avg_accuracy",
    ],
    { order: "session_date asc, start_time asc" },
  );
}

// ── Fetch parent reports ──────────────────────────────────────
export async function fetchParentReports(studentId: number) {
  return searchRead<any>(
    "educare.daily.report",
    [
      ["student_id", "=", studentId],
      ["status", "in", ["sent", "read"]],
    ],
    [
      "id",
      "name",
      "report_date",
      "status",
      "teacher_id",
      "activity_summary",
      "student_id",
    ],
    { order: "report_date desc" },
  );
}

// ── Mark report as read ───────────────────────────────────────
export async function markReportRead(reportId: number) {
  return callKw<boolean>(
    "educare.daily.report",
    "action_mark_read",
    [[reportId]],
    {},
  );
}
