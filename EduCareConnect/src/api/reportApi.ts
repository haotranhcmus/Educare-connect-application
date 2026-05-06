import { searchRead, searchCount, create, write, callKw } from "./odooClient";
import type { ReportListItem, ReportDetail } from "../types";

function toAvatarUrl(b64?: string | false): string | undefined {
  return b64 ? `data:image/png;base64,${b64}` : undefined;
}

async function mergeStudentAvatars(
  records: ReportListItem[],
): Promise<ReportListItem[]> {
  if (records.length === 0) return records;
  const studentIds = [
    ...new Set(
      records
        .map((r) =>
          Array.isArray(r.student_id)
            ? r.student_id[0]
            : ((r.student_id as any)?.id ?? 0),
        )
        .filter(Boolean),
    ),
  ];
  if (studentIds.length === 0) return records;
  try {
    const students = await searchRead<{ id: number; avatar: string | false }>(
      "educare.student",
      [["id", "in", studentIds]],
      ["id", "avatar"],
    );
    const avatarMap = new Map<number, string | undefined>(
      students.map((s) => [s.id, toAvatarUrl(s.avatar)]),
    );
    return records.map((r) => {
      const sid = Array.isArray(r.student_id)
        ? r.student_id[0]
        : ((r.student_id as any)?.id ?? 0);
      return { ...r, student_avatar_url: avatarMap.get(sid) };
    });
  } catch {
    return records;
  }
}

const REPORT_LIST_FIELDS = [
  "id",
  "name",
  "student_id",
  "report_date",
  "status",
  "activity_summary",
  "session_log_id",
];

const REPORT_DETAIL_FIELDS = [
  ...REPORT_LIST_FIELDS,
  "teacher_id",
  "center_id",
  "activity_summary",
  "achievements",
  "challenges_noted",
  "highlight_moment",
  "parent_action_guide",
  "next_session_preview",
  "teacher_note",
  "session_duration",
  "overall_performance",
  "objectives_worked",
  "accuracy_summary",
  "write_date",
];

export async function fetchStudentReports(
  studentId: number,
): Promise<ReportListItem[]> {
  const records = await searchRead<ReportListItem>(
    "educare.daily.report",
    [["student_id", "=", studentId]],
    REPORT_LIST_FIELDS,
    { order: "report_date desc", limit: 50 },
  );
  return mergeStudentAvatars(records);
}

export async function fetchPendingReportCount(
  teacherUid: number,
): Promise<number> {
  return searchCount("educare.daily.report", [
    ["status", "=", "draft"],
    ["teacher_id", "=", teacherUid],
  ]);
}

export async function fetchMyReports(
  teacherUid: number,
): Promise<ReportListItem[]> {
  const records = await searchRead<ReportListItem>(
    "educare.daily.report",
    [["teacher_id", "=", teacherUid]],
    REPORT_LIST_FIELDS,
    { order: "report_date desc", limit: 100 },
  );
  return mergeStudentAvatars(records);
}

export async function fetchReportDetail(
  reportId: number,
): Promise<ReportDetail> {
  const records = await searchRead<ReportDetail>(
    "educare.daily.report",
    [["id", "=", reportId]],
    REPORT_DETAIL_FIELDS,
  );
  if (records.length === 0) throw new Error("Report not found");
  return records[0];
}

export interface SessionAvailableItem {
  id: number;
  name: string;
  student_id: [number, string] | false;
  student_avatar_url?: string;
  session_date: string;
  duration: number;
  overall_performance: string | false;
  result_count: number;
}

export async function fetchSessionsAvailableForReport(
  teacherId: number,
): Promise<SessionAvailableItem[]> {
  // Include both 'completed' and 'done' sessions — teachers can write
  // a parent report as soon as the session is finished.
  const sessions = await searchRead<SessionAvailableItem>(
    "educare.session.log",
    [
      ["teacher_id", "=", teacherId],
      ["status", "in", ["completed", "done"]],
    ],
    [
      "id",
      "name",
      "student_id",
      "session_date",
      "duration",
      "start_time",
      "end_time",
      "overall_performance",
      "result_count",
      "avg_accuracy",
    ],
    { order: "session_date desc, start_time desc", limit: 200 },
  );

  // Exclude any session that already has a report (ANY teacher, not just this one)
  const existingReports = await searchRead<{
    session_log_id: number | [number, string] | false;
  }>(
    "educare.daily.report",
    [["session_log_id", "!=", false]],
    ["session_log_id"],
  );

  const reportedSessionIds = new Set(
    existingReports
      .map((r: any) =>
        Array.isArray(r.session_log_id)
          ? r.session_log_id[0]
          : r.session_log_id,
      )
      .filter(Boolean),
  );

  const filtered = sessions.filter((s) => !reportedSessionIds.has(s.id));
  return mergeStudentAvatars(filtered as any) as Promise<
    SessionAvailableItem[]
  >;
}

export async function fetchReportForSession(
  sessionId: number,
): Promise<{ id: number; status: string } | null> {
  const records = await searchRead<{ id: number; status: string }>(
    "educare.daily.report",
    [["session_log_id", "=", sessionId]],
    ["id", "status"],
    { limit: 1 },
  );
  return records.length > 0 ? records[0] : null;
}

export async function createReport(vals: Record<string, any>): Promise<number> {
  return create("educare.daily.report", vals);
}

export async function updateReport(
  reportId: number,
  vals: Record<string, any>,
): Promise<boolean> {
  return write("educare.daily.report", [reportId], vals);
}

export async function sendReport(reportId: number): Promise<boolean> {
  return callKw("educare.daily.report", "action_send_to_parent", [[reportId]]);
}
