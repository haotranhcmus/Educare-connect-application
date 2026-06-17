import { searchRead, create, write, callKw } from "@api/odooClient";
import type { ReportListItem, ReportDetail, PhotoAsset } from "@t";

function toAvatarUrl(b64?: string | false): string | undefined {
  return b64 ? `data:image/png;base64,${b64}` : undefined;
}

/** Odoo Many2one rendered as raw tuple `[id, display_name]` or `false`. */
type Many2oneTuple = [number, string] | false;

function pickStudentId(value: Many2oneTuple | { id: number }): number {
  if (Array.isArray(value)) return value[0];
  if (value && typeof value === "object" && "id" in value) return value.id;
  return 0;
}

async function mergeStudentAvatars<
  T extends {
    student_id: Many2oneTuple | { id: number };
    student_avatar_url?: string;
    student_nickname?: string;
  },
>(records: T[], fetchNickname = false): Promise<T[]> {
  if (records.length === 0) return records;
  const studentIds = [
    ...new Set(records.map((r) => pickStudentId(r.student_id)).filter(Boolean)),
  ];
  if (studentIds.length === 0) return records;
  try {
    const fields = fetchNickname
      ? ["id", "avatar", "nickname"]
      : ["id", "avatar"];
    const students = await searchRead<{ id: number; avatar: string | false; nickname?: string | false }>(
      "educare.student",
      [["id", "in", studentIds]],
      fields,
    );
    const avatarMap = new Map<number, string | undefined>(
      students.map((s) => [s.id, toAvatarUrl(s.avatar)]),
    );
    const nicknameMap = new Map<number, string | undefined>(
      students.map((s) => [s.id, s.nickname || undefined]),
    );
    return records.map((r) => {
      const sid = pickStudentId(r.student_id);
      const merged: any = { ...r, student_avatar_url: avatarMap.get(sid) };
      if (fetchNickname) merged.student_nickname = nicknameMap.get(sid);
      return merged as T;
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
  "attendance",
  "mood",
  "energy_level",
  "engagement_level",
  "observation_notes",
  "objective_ids",
  "objectives_worked",
  "accuracy_summary",
  "write_date",
  "photo_ids",
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
  return mergeStudentAvatars(records, true);
}

/**
 * Count finished sessions (done/completed) that don't have ANY report yet —
 * i.e. the "Chưa báo cáo" badge. This MUST mirror the exclusion logic of
 * `fetchSessionsAvailableForReport` so the badge matches the list it opens.
 * (A saved draft already occupies the session's single report slot, so the
 * session leaves this count once a draft exists.)
 */
export async function fetchPendingReportCount(
  teacherUid: number,
): Promise<number> {
  const sessions = await searchRead<{ id: number }>(
    "educare.session.log",
    [
      ["teacher_id", "=", teacherUid],
      ["status", "in", ["completed", "done"]],
    ],
    ["id"],
    { limit: 1000 },
  );
  if (sessions.length === 0) return 0;

  const existingReports = await searchRead<{
    session_log_id: number | [number, string] | false;
  }>("educare.daily.report", [["session_log_id", "!=", false]], [
    "session_log_id",
  ]);

  const reportedSessionIds = new Set(
    existingReports
      .map((r) =>
        Array.isArray(r.session_log_id)
          ? r.session_log_id[0]
          : (r.session_log_id as number | false),
      )
      .filter((id): id is number => typeof id === "number"),
  );

  return sessions.filter((s) => !reportedSessionIds.has(s.id)).length;
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
  return mergeStudentAvatars(records, true);
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
      .map((r) =>
        Array.isArray(r.session_log_id)
          ? r.session_log_id[0]
          : (r.session_log_id as number | false),
      )
      .filter((id): id is number => typeof id === "number"),
  );

  const filtered = sessions.filter((s) => !reportedSessionIds.has(s.id));
  return mergeStudentAvatars(filtered, true);
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

export async function fetchReportPhotoUrls(
  attachmentIds: number[],
): Promise<string[]> {
  if (attachmentIds.length === 0) return [];
  const records = await searchRead<{ id: number; datas: string | false }>(
    "ir.attachment",
    [["id", "in", attachmentIds]],
    ["id", "datas"],
  );
  return records
    .filter((r) => r.datas)
    .map((r) => `data:image/jpeg;base64,${r.datas}`);
}

export async function uploadReportPhotos(
  reportId: number,
  photoAssets: PhotoAsset[],
): Promise<void> {
  if (photoAssets.length === 0) return;
  const attachmentIds: number[] = [];
  for (const asset of photoAssets) {
    const fileName = asset.uri.split("/").pop() || "photo.jpg";
    const id = await create("ir.attachment", {
      name: fileName,
      datas: asset.base64,
      res_model: "educare.daily.report",
      res_id: reportId,
      type: "binary",
    });
    attachmentIds.push(id);
  }
  if (attachmentIds.length > 0) {
    await write("educare.daily.report", [reportId], {
      photo_ids: attachmentIds.map((id) => [4, id]),
    });
  }
}
