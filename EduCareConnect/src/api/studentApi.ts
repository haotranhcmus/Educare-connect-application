import { client } from "./odooClient";
import type { StudentListItem, StudentDetail } from "../types";

const STUDENT_LIST_FIELDS = [
  "id",
  "name",
  "student_code",
  "status",
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
  "sensory_profile",
  "reinforcement_preferences",
];

/**
 * Fetch students assigned to the current teacher.
 * Filter: assigned_teacher_id = uid OR co_teacher_ids includes uid
 */
export async function fetchMyStudents(uid: number): Promise<StudentListItem[]> {
  const response = await client.post("/web/dataset/call_kw", {
    jsonrpc: "2.0",
    params: {
      model: "educare.student",
      method: "search_read",
      args: [
        [
          "|",
          ["assigned_teacher_id.user_id", "=", uid],
          ["co_teacher_ids.user_id", "in", [uid]],
        ],
      ],
      kwargs: {
        fields: STUDENT_LIST_FIELDS,
        order: "name asc",
      },
    },
  });
  return response.data?.result || [];
}

/**
 * Fetch single student detail by ID.
 */
export async function fetchStudentDetail(
  studentId: number,
): Promise<StudentDetail> {
  const response = await client.post("/web/dataset/call_kw", {
    jsonrpc: "2.0",
    params: {
      model: "educare.student",
      method: "read",
      args: [[studentId]],
      kwargs: {
        fields: STUDENT_DETAIL_FIELDS,
      },
    },
  });
  const records = response.data?.result;
  if (!records || records.length === 0) {
    throw new Error("Không tìm thấy học sinh");
  }
  return records[0];
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