import { odooClient } from "./odooClient";
import type { IepPlanListItem } from "../types";

const IEP_PLAN_LIST_FIELDS = [
  "id",
  "iep_period",
  "status",
  "version_number",
  "start_date",
  "end_date",
  "supervisor_id",
  "goal_count",
];

/**
 * Fetch IEP plans for a student, newest first.
 */
export async function fetchStudentIepPlans(
  studentId: number,
): Promise<IepPlanListItem[]> {
  const response = await odooClient.post("/web/dataset/call_kw", {
    jsonrpc: "2.0",
    params: {
      model: "educare.iep.plan",
      method: "search_read",
      args: [[["student_id", "=", studentId]]],
      kwargs: {
        fields: IEP_PLAN_LIST_FIELDS,
        order: "start_date desc",
      },
    },
  });
  return response.data?.result || [];
}