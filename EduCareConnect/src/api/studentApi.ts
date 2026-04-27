import { searchRead, read } from "./odooClient";
import type { StudentListItem, StudentDetail } from "../types";

type StudentListRaw = StudentListItem & { avatar?: string | false };
type StudentDetailRaw = StudentDetail & { avatar?: string | false };

function toAvatarUrl(avatar?: string | false): string | undefined {
  if (!avatar) return undefined;
  return `data:image/png;base64,${avatar}`;
}

const STUDENT_LIST_FIELDS = [
  "id",
  "name",
  "student_code",
  "status",
  "avatar",
  "center_id",
  "primary_diagnosis",
  "date_of_birth",
  "gender",
];

const STUDENT_DETAIL_FIELDS = [
  "id",
  "name",
  "student_code",
  "status",
  "avatar",
  "center_id",
  "gender",
  "date_of_birth",
  "age",
  "enrollment_date",
  "primary_diagnosis",
  "secondary_diagnosis_ids",
  "diagnosis_date",
  "diagnosed_by",
  "current_medications",
  "medical_alert",
  "medical_alert_detail",
  "assigned_teacher_id",
  "co_teacher_ids",
  "supervisor_id",
  "parent_user_id",
  "parent_name",
  "parent_phone",
  "parent_email",
  "parent_relation",
  "preferred_contact_method",
  "receive_daily_report",
  "learning_style",
  "communication_level",
  "attention_span",
  "behavior_notes",
  "reinforcement_preferences",
];

/**
 * Fetch students assigned to the current teacher.
 * Filter: assigned_teacher_id = uid OR co_teacher_ids includes uid
 */
export async function fetchMyStudents(uid: number): Promise<StudentListItem[]> {
  const records = await searchRead<StudentListRaw>(
    "educare.student",
    [
      "|",
      // assigned_teacher_id / co_teacher_ids are both res.users fields,
      // so compare directly with current uid from Odoo session.
      ["assigned_teacher_id", "=", uid],
      ["co_teacher_ids", "in", [uid]],
      ["status", "=", "active"],
    ],
    STUDENT_LIST_FIELDS,
    { order: "name asc" },
  );

  return records.map(({ avatar, ...student }) => ({
    ...student,
    avatar_url: toAvatarUrl(avatar),
  }));
}

/**
 * Fetch set of student IDs that have at least one active IEP plan.
 */
export async function fetchStudentIdsWithActivePlan(): Promise<Set<number>> {
  const plans = await searchRead<{ student_id: [number, string] | false }>(
    "educare.iep.plan",
    [["status", "=", "active"]],
    ["student_id"],
    { limit: 500 },
  );
  const ids = new Set<number>();
  for (const p of plans) {
    if (Array.isArray(p.student_id)) ids.add(p.student_id[0]);
  }
  return ids;
}

/**
 * Fetch single student detail by ID.
 */
export async function fetchStudentDetail(
  studentId: number,
): Promise<StudentDetail> {
  const records = await read<StudentDetailRaw>(
    "educare.student",
    [studentId],
    STUDENT_DETAIL_FIELDS,
  );
  if (!records || records.length === 0) {
    throw new Error("Không tìm thấy học sinh");
  }
  const { avatar, ...student } = records[0];
  return {
    ...student,
    avatar_url: toAvatarUrl(avatar),
  };
}

/**
 * Fetch student count by status for filter chips.
 */
export async function fetchStudentCounts(uid: number) {
  const all = await fetchMyStudents(uid);
  return {
    total: all.length,
    active: all.filter((s) => s.status === "active").length,
    inactive: all.filter((s) => s.status !== "active").length,
  };
}
