import { searchRead, read } from "@api/odooClient";
import type {
  IepPlan,
  IepGoal,
  IepObjectiveListItem,
  IepObjectiveDetail,
  SessionResult,
  SessionResultTrial,
} from "@t";

const PLAN_DETAIL_FIELDS = [
  "id",
  "iep_period",
  "status",
  "version_number",
  "start_date",
  "end_date",
  "student_id",
  "supervisor_id",
  "assigned_teacher_id",
  "review_frequency",
  "parent_consent",
  "maintenance_mode",
  "closing_reason",
  "goal_ids",
  "goal_count",
];

const GOAL_FIELDS = [
  "id",
  "name",
  "goal_code",
  "plan_id",
  "goal_domain_id",
  "status",
  "priority",
  "progress_pct",
  "current_accuracy_pct",
  "objective_ids",
  "objective_count",
  "total_sessions",
];

const OBJECTIVE_FIELDS = [
  "id",
  "name",
  "objective_code",
  "goal_id",
  "description",
  "status",
  "measurement_type",
  "baseline_accuracy_pct",
  "current_accuracy_pct",
  "locked_accuracy_pct",
  "target_accuracy_pct",
  "target_prompt_level",
  "target_duration_seconds",
  "baseline_count",
  "target_count",
  "progress_pct",
  "trend",
  "weight",
  "consecutive_sessions_required",
  "consecutive_sessions_achieved",
  "last_session_date",
  "last_session_accuracy",
  "total_sessions_worked",
  "mastery_date",
];

// Extra fields only needed for detail view
const OBJECTIVE_DETAIL_FIELDS = [
  ...OBJECTIVE_FIELDS,
  "student_id",
  "measurement_type",
  "target_duration_seconds",
  "baseline_count",
  "target_count",
  "materials_needed",
  "implementation_steps",
  "baseline_description",
  "difficulty_id",
  "smart_specific",
  "smart_measurable",
  "smart_analysis",
  "smart_timebound",
];

export async function fetchIepPlanDetail(planId: number): Promise<IepPlan> {
  const records = await read<IepPlan>(
    "educare.iep.plan",
    [planId],
    PLAN_DETAIL_FIELDS,
  );
  if (!records || records.length === 0) throw new Error("Plan not found");
  return records[0];
}

export async function fetchGoalsForPlan(planId: number): Promise<IepGoal[]> {
  const records = await searchRead<IepGoal>(
    "educare.iep.goal",
    [["plan_id", "=", planId]],
    GOAL_FIELDS,
    { order: "goal_code asc" },
  );
  return records;
}

export async function fetchGoalsByIds(ids: number[]): Promise<IepGoal[]> {
  if (!ids.length) return [];
  return searchRead<IepGoal>(
    "educare.iep.goal",
    [["id", "in", ids]],
    GOAL_FIELDS,
    { order: "goal_code asc" },
  );
}

export async function fetchObjectivesForGoal(
  goalId: number,
): Promise<IepObjectiveListItem[]> {
  const records = await searchRead<IepObjectiveListItem>(
    "educare.iep.objective",
    [["goal_id", "=", goalId]],
    OBJECTIVE_FIELDS,
    { order: "objective_code asc" },
  );
  return records;
}

export async function fetchObjectiveDetail(
  objectiveId: number,
): Promise<IepObjectiveDetail> {
  const records = await read<IepObjectiveDetail>(
    "educare.iep.objective",
    [objectiveId],
    OBJECTIVE_DETAIL_FIELDS,
  );
  if (!records || records.length === 0) throw new Error("Objective not found");
  return records[0];
}

export async function fetchObjectiveResults(
  objectiveId: number,
  limit = 10,
): Promise<SessionResult[]> {
  const records = await searchRead<SessionResult>(
    "educare.session.result",
    [
      ["objective_id", "=", objectiveId],
      ["session_id.status", "=", "done"],
      ["is_recorded", "=", true],
    ],
    [
      "id",
      "session_id",
      "session_date",
      "measurement_type",
      "score_pct",
      "is_recorded",
      "correct_trials",
      "total_trials",
      "actual_duration_seconds",
      "actual_count",
      "trial_ids",
      "phase",
      "result_phase",
      "teaching_method",
      "mastery_achieved",
    ],
    { order: "session_date asc", limit },
  );

  // For prompt_level objectives, resolve per-trial details so the history can
  // show each trial's support level + score. trial_ids only returns IDs.
  const allTrialIds = records.flatMap((r) => r.trial_ids ?? []);
  if (allTrialIds.length > 0) {
    const trials = await searchRead<SessionResultTrial & { result_id: [number, string] | number }>(
      "educare.session.result.trial",
      [["id", "in", allTrialIds]],
      ["id", "result_id", "sequence", "prompt_level", "weight"],
      { order: "sequence asc, id asc" },
    );
    const byResult = new Map<number, SessionResultTrial[]>();
    for (const t of trials) {
      const rid = Array.isArray(t.result_id) ? t.result_id[0] : t.result_id;
      if (!byResult.has(rid)) byResult.set(rid, []);
      byResult.get(rid)!.push({
        id: t.id,
        sequence: t.sequence,
        prompt_level: t.prompt_level,
        weight: t.weight,
      });
    }
    for (const r of records) {
      r.trials = byResult.get(r.id) ?? [];
    }
  }

  return records;
}

export async function fetchStudentIepPlans(
  studentId: number,
): Promise<IepPlan[]> {
  const records = await searchRead<IepPlan>(
    "educare.iep.plan",
    [["student_id", "=", studentId]],
    PLAN_DETAIL_FIELDS,
    { order: "iep_period desc" },
  );
  return records;
}
