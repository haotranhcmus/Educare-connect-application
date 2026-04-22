import { read, searchRead, write, create, callKw } from "./odooClient";
import type {
  SessionListItem,
  SessionLogDetail,
  SessionResult,
  IepObjectiveListItem,
} from "../types";

const SESSION_LIST_FIELDS = [
  "id",
  "name",
  "student_id",
  "session_date",
  "start_time",
  "end_time",
  "duration",
  "location",
  "session_type",
  "session_purpose",
  "status",
  "avg_accuracy",
  "result_count",
];

const SESSION_DETAIL_FIELDS = [
  ...SESSION_LIST_FIELDS,
  "teacher_id",
  "center_id",
  "attendance",
  "mood",
  "energy_level",
  "engagement_level",
  "overall_performance",
  "notes",
  "result_line_ids",
  "objective_ids",
];

export async function fetchStudentSessions(
  studentId: number,
): Promise<SessionListItem[]> {
  const records = await searchRead<SessionListItem>(
    "educare.session.log",
    [["student_id", "=", studentId]],
    SESSION_LIST_FIELDS,
    { order: "session_date desc, start_time desc", limit: 50 },
  );
  return records;
}

export async function fetchTodaySessions(
  teacherUid: number,
): Promise<SessionListItem[]> {
  const today = new Date().toISOString().split("T")[0];
  const records = await searchRead<SessionListItem>(
    "educare.session.log",
    [
      ["session_date", "=", today],
      ["teacher_id", "=", teacherUid],
    ],
    SESSION_LIST_FIELDS,
    { order: "start_time asc" },
  );
  return records;
}

export async function fetchMySessions(
  teacherId: number,
  filters?: { dateFrom?: string; dateTo?: string },
): Promise<SessionListItem[]> {
  const domain: any[] = [["teacher_id", "=", teacherId]];
  if (filters?.dateFrom) domain.push(["session_date", ">=", filters.dateFrom]);
  if (filters?.dateTo) domain.push(["session_date", "<=", filters.dateTo]);

  const records = await searchRead<SessionListItem>(
    "educare.session.log",
    domain,
    SESSION_LIST_FIELDS,
    { limit: 200, order: "session_date desc, start_time desc" },
  );
  return records;
}

export async function fetchSessionDetail(
  sessionId: number,
): Promise<SessionLogDetail> {
  const result = await read<SessionLogDetail>(
    "educare.session.log",
    [sessionId],
    SESSION_DETAIL_FIELDS,
  );
  return result[0];
}

export async function fetchSessionResults(
  sessionId: number,
): Promise<SessionResult[]> {
  const records = await searchRead<SessionResult>(
    "educare.session.result",
    [["session_log_id", "=", sessionId]],
    [
      "id",
      "objective_id",
      "result_type",
      "correct_trials",
      "total_trials",
      "accuracy_pct",
      "prompt_level_used",
      "phase",
      "notes",
      "teaching_method",
    ],
  );
  return records;
}

export async function createSession(vals: {
  student_id: number;
  session_date: string;
  start_time: number;
  end_time: number;
  location: string;
  session_type: string;
  session_purpose: string;
  objective_ids?: [number, number, number[]][];
}): Promise<number> {
  const newId = await create("educare.session.log", vals);
  await callKw("educare.session.log", "action_schedule", [[newId]]);
  return newId;
}

export async function updateSession(
  sessionId: number,
  vals: Record<string, any>,
): Promise<boolean> {
  const response = await write("educare.session.log", [sessionId], vals);
  return response;
}

type ActiveObjective = Pick<
  IepObjectiveListItem,
  | "id"
  | "objective_code"
  | "name"
  | "status"
  | "goal_id"
  | "current_accuracy_pct"
  | "target_accuracy_pct"
  | "baseline_accuracy_pct"
  | "progress_pct"
  | "trend"
>;

export async function fetchStudentActiveObjectives(
  studentId: number,
): Promise<ActiveObjective[]> {
  const records = await searchRead<ActiveObjective>(
    "educare.iep.objective",
    [
      ["student_id", "=", studentId],
      ["status", "=", "in_progress"],
    ],
    [
      "id",
      "objective_code",
      "name",
      "status",
      "goal_id",
      "current_accuracy_pct",
      "baseline_accuracy_pct",
      "progress_pct",
      "trend",
      "target_accuracy_pct",
    ],
  );
  return records;
}

/** Fetch objectives by exact IDs — used by EvalStep1 to show only session-linked objectives. */
export async function fetchObjectivesByIds(
  ids: number[],
): Promise<ActiveObjective[]> {
  if (!ids.length) return [];
  const records = await searchRead<ActiveObjective>(
    "educare.iep.objective",
    [["id", "in", ids]],
    [
      "id",
      "objective_code",
      "name",
      "status",
      "goal_id",
      "current_accuracy_pct",
      "baseline_accuracy_pct",
      "progress_pct",
      "trend",
      "target_accuracy_pct",
    ],
  );
  return records;
}
