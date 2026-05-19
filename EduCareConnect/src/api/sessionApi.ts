import { read, searchRead, write, create, callKw } from "./odooClient";
import { logger } from "../utils/logger";
import type {
  SessionListItem,
  SessionLogDetail,
  SessionResult,
  IepObjectiveListItem,
} from "../types";

function toAvatarUrl(b64?: string | false): string | undefined {
  return b64 ? `data:image/png;base64,${b64}` : undefined;
}

/** Batch-fetch student avatars + nickname and merge into session/record list. */
async function mergeStudentAvatars<
  T extends { student_id: any; student_avatar_url?: string; student_nickname?: string },
>(records: T[], fetchNickname = false): Promise<T[]> {
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
      const sid = Array.isArray(r.student_id)
        ? r.student_id[0]
        : ((r.student_id as any)?.id ?? 0);
      const merged: any = { ...r, student_avatar_url: avatarMap.get(sid) };
      if (fetchNickname) merged.student_nickname = nicknameMap.get(sid);
      return merged as T;
    });
  } catch {
    return records;
  }
}

const SESSION_LIST_FIELDS = [
  "id",
  "name",
  "student_id",
  "student_name",
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
  "cancel_type",
  "cancel_notes",
  "result_line_ids",
  "objective_ids",
];

export async function fetchStudentSessions(
  studentId: number,
): Promise<SessionListItem[]> {
  logger.session("fetchStudentSessions", "start", { studentId });
  try {
    const records = await searchRead<any>(
      "educare.session.log",
      [["student_id", "=", studentId]],
      SESSION_LIST_FIELDS,
      { order: "session_date desc, start_time desc", limit: 50 },
    );
    logger.session("fetchStudentSessions", `ok — ${records.length} records`);
    return mergeStudentAvatars<SessionListItem>(records, true);
  } catch (e) {
    logger.error("fetchStudentSessions", "failed", e);
    throw e;
  }
}

export async function fetchTodaySessions(
  teacherUid: number,
): Promise<SessionListItem[]> {
  const today = new Date().toISOString().split("T")[0];
  logger.session("fetchTodaySessions", "start", { teacherUid, today });
  try {
    const records = await searchRead<any>(
      "educare.session.log",
      [
        ["session_date", "=", today],
        ["teacher_id", "=", teacherUid],
      ],
      SESSION_LIST_FIELDS,
      { order: "start_time asc" },
    );
    logger.session("fetchTodaySessions", `ok — ${records.length} records`);
    return mergeStudentAvatars<SessionListItem>(records, true);
  } catch (e) {
    logger.error("fetchTodaySessions", "failed", e);
    throw e;
  }
}

export async function fetchMySessions(
  teacherId: number,
  filters?: { dateFrom?: string; dateTo?: string },
): Promise<SessionListItem[]> {
  logger.session("fetchMySessions", "start", { teacherId, filters });
  const domain: unknown[] = [["teacher_id", "=", teacherId]];
  if (filters?.dateFrom) domain.push(["session_date", ">=", filters.dateFrom]);
  if (filters?.dateTo) domain.push(["session_date", "<=", filters.dateTo]);

  try {
    const records = await searchRead<any>(
      "educare.session.log",
      domain,
      SESSION_LIST_FIELDS,
      { limit: 200, order: "session_date desc, start_time desc" },
    );
    logger.session("fetchMySessions", `ok — ${records.length} records`);
    return mergeStudentAvatars<SessionListItem>(records, true);
  } catch (e) {
    logger.error("fetchMySessions", "failed", e);
    throw e;
  }
}

export async function fetchSessionDetail(
  sessionId: number,
): Promise<SessionLogDetail> {
  logger.session("fetchSessionDetail", "start", { sessionId });
  try {
    const result = await read<any>(
      "educare.session.log",
      [sessionId],
      SESSION_DETAIL_FIELDS,
    );
    if (!result || result.length === 0) {
      logger.error(
        "fetchSessionDetail",
        `No record returned for sessionId=${sessionId}. Check record rules — user may not have access.`,
      );
      throw new Error(
        `Buổi học #${sessionId} không tồn tại hoặc bạn không có quyền truy cập.`,
      );
    }
    logger.session("fetchSessionDetail", "ok", {
      id: result[0].id,
      name: result[0].name,
      status: result[0].status,
      objectiveCount: result[0].objective_ids?.length ?? 0,
    });
    return (await mergeStudentAvatars<SessionLogDetail>([result[0]]))[0];
  } catch (e: any) {
    logger.error("fetchSessionDetail", `failed for sessionId=${sessionId}`, {
      message: e?.message,
      odooError: e?.odooError,
    });
    throw e;
  }
}

export async function fetchSessionResults(
  sessionId: number,
): Promise<SessionResult[]> {
  logger.session("fetchSessionResults", "start", { sessionId });
  try {
    const records = await searchRead<SessionResult>(
      "educare.session.result",
      [["session_id", "=", sessionId]],
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
    logger.session(
      "fetchSessionResults",
      `ok — ${records.length} results for session ${sessionId}`,
    );
    return records;
  } catch (e: any) {
    logger.error("fetchSessionResults", `failed for sessionId=${sessionId}`, e);
    throw e;
  }
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
  logger.session("createSession", "start", {
    student_id: vals.student_id,
    session_date: vals.session_date,
    objectiveCount: (vals.objective_ids?.[0] as any)?.[2]?.length ?? 0,
  });
  try {
    const newId = await create("educare.session.log", vals);
    logger.session(
      "createSession",
      `record created id=${newId}, scheduling...`,
    );
    await callKw("educare.session.log", "action_schedule", [[newId]]);
    logger.session("createSession", `ok — session ${newId} scheduled`);
    return newId;
  } catch (e: any) {
    logger.error("createSession", "failed", {
      message: e?.message,
      odooError: e?.odooError,
    });
    throw e;
  }
}

export async function updateSession(
  sessionId: number,
  vals: Record<string, any>,
): Promise<boolean> {
  logger.session("updateSession", "start", {
    sessionId,
    keys: Object.keys(vals),
  });
  try {
    const response = await write("educare.session.log", [sessionId], vals);
    logger.session("updateSession", `ok — session ${sessionId} updated`);
    return response;
  } catch (e: any) {
    logger.error("updateSession", `failed for sessionId=${sessionId}`, {
      message: e?.message,
      odooError: e?.odooError,
    });
    throw e;
  }
}

type ActiveObjective = Pick<
  IepObjectiveListItem,
  | "id"
  | "objective_code"
  | "name"
  | "status"
  | "goal_id"
  | "domain_ids"
  | "current_accuracy_pct"
  | "target_accuracy_pct"
  | "baseline_accuracy_pct"
  | "progress_pct"
  | "trend"
  | "description"
  | "consecutive_sessions_required"
  | "consecutive_sessions_achieved"
  | "measurement_method"
  | "implementation_steps"
  | "materials_needed"
  | "smart_specific"
  | "smart_measurable"
  | "smart_analysis"
  | "smart_timebound"
  | "difficulty_id"
  | "suggested_prompt_level_id"
>;

export async function fetchStudentActiveObjectives(
  studentId: number,
): Promise<ActiveObjective[]> {
  logger.session("fetchStudentActiveObjectives", "start", { studentId });
  try {
    const records = await searchRead<ActiveObjective>(
      "educare.iep.objective",
      [
        ["student_id", "=", studentId],
        ["status", "in", ["not_started", "in_progress"]],
      ],
      [
        "id",
        "objective_code",
        "name",
        "status",
        "goal_id",
        "domain_ids",
        "current_accuracy_pct",
        "baseline_accuracy_pct",
        "progress_pct",
        "trend",
        "target_accuracy_pct",
        "description",
        "consecutive_sessions_required",
        "consecutive_sessions_achieved",
        "measurement_method",
        "implementation_steps",
        "materials_needed",
      ],
    );

    // Resolve domain IDs → [id, name] pairs
    const allDomainIds = [
      ...new Set(
        records.flatMap((r) =>
          Array.isArray(r.domain_ids)
            ? (r.domain_ids as any[]).filter((d) => typeof d === "number")
            : [],
        ),
      ),
    ];
    if (allDomainIds.length > 0) {
      const domainRecords = await searchRead<{ id: number; name: string }>(
        "educare.domain",
        [["id", "in", allDomainIds]],
        ["id", "name"],
      );
      const domainMap = new Map(domainRecords.map((d) => [d.id, d.name]));
      for (const rec of records) {
        if (Array.isArray(rec.domain_ids)) {
          rec.domain_ids = (rec.domain_ids as any[]).map((d) =>
            typeof d === "number" ? [d, domainMap.get(d) ?? String(d)] : d,
          ) as any;
        }
      }
    }

    logger.session(
      "fetchStudentActiveObjectives",
      `ok — ${records.length} objectives for student ${studentId}`,
    );
    return records;
  } catch (e: any) {
    logger.error(
      "fetchStudentActiveObjectives",
      `failed for studentId=${studentId}`,
      e,
    );
    throw e;
  }
}

/** Fetch objectives by exact IDs — used by EvalStep1 to show only session-linked objectives. */
export async function fetchObjectivesByIds(
  ids: number[],
): Promise<ActiveObjective[]> {
  if (!ids.length) return [];
  logger.session("fetchObjectivesByIds", "start", { ids });
  try {
    const records = await searchRead<ActiveObjective>(
      "educare.iep.objective",
      [["id", "in", ids]],
      [
        "id",
        "objective_code",
        "name",
        "status",
        "goal_id",
        "domain_ids",
        "current_accuracy_pct",
        "baseline_accuracy_pct",
        "progress_pct",
        "trend",
        "target_accuracy_pct",
        "description",
        "consecutive_sessions_required",
        "consecutive_sessions_achieved",
        "measurement_method",
        "implementation_steps",
        "materials_needed",
        "smart_specific",
        "smart_measurable",
        "smart_analysis",
        "smart_timebound",
        "difficulty_id",
        "suggested_prompt_level_id",
      ],
    );
    logger.session(
      "fetchObjectivesByIds",
      `ok — ${records.length}/${ids.length} objectives fetched`,
    );
    if (records.length !== ids.length) {
      logger.warn(
        "fetchObjectivesByIds",
        `Expected ${ids.length} objectives but got ${records.length}. Missing ids: ${ids.filter((id) => !records.find((r) => r.id === id)).join(", ")}`,
      );
    }

    // Resolve domain IDs → [id, name] pairs (Many2many returns plain IDs only)
    const allDomainIds = [
      ...new Set(
        records.flatMap((r) =>
          Array.isArray(r.domain_ids)
            ? (r.domain_ids as any[]).filter((d) => typeof d === "number")
            : [],
        ),
      ),
    ];
    if (allDomainIds.length > 0) {
      const domainRecords = await searchRead<{ id: number; name: string }>(
        "educare.domain",
        [["id", "in", allDomainIds]],
        ["id", "name"],
      );
      const domainMap = new Map(domainRecords.map((d) => [d.id, d.name]));
      for (const rec of records) {
        if (Array.isArray(rec.domain_ids)) {
          rec.domain_ids = (rec.domain_ids as any[]).map((d) =>
            typeof d === "number" ? [d, domainMap.get(d) ?? String(d)] : d,
          ) as any;
        }
      }
    }

    return records;
  } catch (e: any) {
    logger.error("fetchObjectivesByIds", "failed", { ids, error: e?.message });
    throw e;
  }
}

export interface ConflictSession {
  id: number;
  start_time: number;
  end_time: number;
}

export async function checkStudentSessionConflict(
  studentId: number,
  sessionDate: string,
): Promise<ConflictSession[]> {
  const records = await searchRead<ConflictSession>(
    "educare.session.log",
    [
      ["student_id", "=", studentId],
      ["session_date", "=", sessionDate],
      ["status", "in", ["draft", "scheduled"]],
    ],
    ["id", "start_time", "end_time"],
    { limit: 10 },
  );
  return records;
}

export async function scheduleSession(sessionId: number): Promise<boolean> {
  return callKw<boolean>(
    "educare.session.log",
    "action_schedule",
    [[sessionId]],
    {},
  );
}

export async function deleteSession(sessionId: number): Promise<boolean> {
  logger.session("deleteSession", "start", { sessionId });
  try {
    const response = await callKw<boolean>(
      "educare.session.log",
      "unlink",
      [[sessionId]],
      {},
    );
    logger.session("deleteSession", `ok — session ${sessionId} deleted`);
    return response;
  } catch (e: any) {
    logger.error("deleteSession", `failed for sessionId=${sessionId}`, {
      message: e?.message,
      odooError: e?.odooError,
    });
    throw e;
  }
}

export async function cancelSession(
  sessionId: number,
  cancelType: "cancelled_center" | "cancelled_family",
  reason: string = "",
): Promise<boolean> {
  logger.session("cancelSession", "start", { sessionId, cancelType });
  try {
    const response = await callKw<boolean>(
      "educare.session.log",
      "action_cancel_session",
      [[sessionId], cancelType, reason],
      {},
    );
    logger.session("cancelSession", `ok — session ${sessionId} cancelled`);
    return response;
  } catch (e: any) {
    logger.error("cancelSession", `failed for sessionId=${sessionId}`, {
      message: e?.message,
      odooError: e?.odooError,
    });
    throw e;
  }
}
