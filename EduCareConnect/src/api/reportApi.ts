import { searchRead, searchCount, create, write, callKw } from "./odooClient";
import type { ReportListItem, ReportDetail } from "../types";

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
  return searchRead<ReportListItem>(
    "educare.daily.report",
    [["student_id", "=", studentId]],
    REPORT_LIST_FIELDS,
    { order: "report_date desc", limit: 50 },
  );
}

export async function fetchPendingReportCount(
  teacherUid: number,
): Promise<number> {
  const result = searchCount("educare.daily.report", [
    ["status", "=", "draft"],
    "|",
    ["teacher_id", "=", teacherUid],
    ["teacher_id", "in", [teacherUid]],
  ]);
  return result;
}

export async function fetchMyReports(
  teacherUid: number,
): Promise<ReportListItem[]> {
  return searchRead<ReportListItem>(
    "educare.daily.report",
    [
      ["status", "=", "draft"],
      "|",
      ["teacher_id", "=", teacherUid],
      ["teacher_id", "in", [teacherUid]],
    ],
    REPORT_LIST_FIELDS,
    { order: "report_date desc", limit: 50 },
  );
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
  session_date: string;
  duration: number;
  overall_performance: string | false;
  result_count: number;
}

export async function fetchSessionsAvailableForReport(
  teacherId: number,
): Promise<SessionAvailableItem[]> {
  const doneSessions = await searchRead<SessionAvailableItem>(
    "educare.session.log",
    [
      ["teacher_id", "=", teacherId],
      ["status", "=", "done"],
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
      "avg_accuracy_pct",
    ],
    { order: "session_date desc, start_time desc", limit: 100 },
  );

  const existingReports = await searchRead<{
    session_log_id: number | [number, string] | false;
  }>(
    "educare.daily.report",
    [["teacher_id", "=", teacherId]],
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

  return doneSessions.filter((s: any) => !reportedSessionIds.has(s.id));
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
  return callKw("educare.daily.report", "action_send", [[reportId]]);
}
