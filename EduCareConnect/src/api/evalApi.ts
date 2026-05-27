import { callKw, create, read, searchRead, write } from "@api/odooClient";
import { logger } from "@utils/logger";
import type { MeasurementType } from "@t/enums";

const SESSION_MODEL = "educare.session.log";
const RESULT_MODEL = "educare.session.result";

export interface ResultInput {
  objective_id: number;
  measurement_type: MeasurementType;
  // accuracy
  correct_trials?: number;
  total_trials?: number;
  // prompt_level — ordered list of prompt level keys, one per trial
  trial_prompts?: string[];
  // duration
  actual_duration_seconds?: number;
  // frequency_increase / frequency_decrease
  actual_count?: number;
  notes?: string;
  /** Client-side score preview (0–100). Not sent — backend recomputes. */
  score_pct?: number;
}

/**
 * Build the ORM vals for one result line based on its measurement_type.
 * is_recorded is always set so the row counts as evaluated (frequency_decrease
 * can legitimately be 0, so we never infer "recorded" from values).
 */
function buildResultVals(sessionId: number, r: ResultInput): Record<string, unknown> {
  const vals: Record<string, unknown> = {
    session_id: sessionId,
    objective_id: r.objective_id,
    is_recorded: true,
    notes: r.notes || "",
  };
  switch (r.measurement_type) {
    case "accuracy":
      vals.correct_trials = r.correct_trials ?? 0;
      vals.total_trials = r.total_trials ?? 0;
      break;
    case "prompt_level":
      // Replace any existing trials, then recreate from the entered list.
      vals.trial_ids = [
        [5, 0, 0],
        ...(r.trial_prompts ?? []).map((level, idx) => [
          0,
          0,
          { sequence: (idx + 1) * 10, prompt_level: level },
        ]),
      ];
      break;
    case "duration":
      vals.actual_duration_seconds = r.actual_duration_seconds ?? 0;
      break;
    case "frequency_increase":
    case "frequency_decrease":
      vals.actual_count = r.actual_count ?? 0;
      break;
  }
  return vals;
}

export interface RemainingSession {
  id: number;
  session_date: string;
  start_time: number;
  end_time: number;
  status: string;
}

export interface IepCompletionSignal {
  iep_just_completed: boolean;
  plan_id: number | false;
  remaining_sessions: RemainingSession[];
}

interface SessionResultRow {
  id: number;
  objective_id: [number, string] | number;
}

interface SessionStateRow {
  id: number;
  status: string;
}

/**
 * Submit all results and finalize session
 * Steps: create/update results → confirm (status=done)
 */
export async function submitEvaluation(
  sessionId: number,
  results: ResultInput[],
): Promise<IepCompletionSignal> {
  logger.eval("submitEvaluation", "start", {
    sessionId,
    resultCount: results.length,
  });

  // Ensure result lines exist (idempotent — creates them if missing, no-op if already present).
  // This handles sessions that entered 'completed' state without going through action_schedule.
  logger.eval("submitEvaluation", "step 0 — ensuring result lines exist...");
  await callKw(SESSION_MODEL, "api_ensure_result_lines", [[sessionId]]);

  logger.eval("submitEvaluation", "step 1 — fetching existing result rows...");
  const existingRows = await searchRead<SessionResultRow>(
    RESULT_MODEL,
    [["session_id", "=", sessionId]],
    ["id", "objective_id"],
    { limit: 500 },
  );
  logger.eval(
    "submitEvaluation",
    `found ${existingRows.length} existing result rows`,
  );

  const rowByObjectiveId = new Map<number, number>();
  for (const row of existingRows) {
    const objectiveId = Array.isArray(row.objective_id)
      ? row.objective_id[0]
      : row.objective_id;
    rowByObjectiveId.set(objectiveId, row.id);
  }

  for (const r of results) {
    const vals = buildResultVals(sessionId, r);

    const existingId = rowByObjectiveId.get(r.objective_id);
    if (existingId) {
      logger.eval(
        "submitEvaluation",
        `updating result row ${existingId} for objective ${r.objective_id}`,
      );
      await write(RESULT_MODEL, [existingId], vals);
    } else {
      logger.eval(
        "submitEvaluation",
        `creating result row for objective ${r.objective_id}`,
      );
      await create(RESULT_MODEL, vals);
    }
  }

  // 2. Advance workflow to done via real backend actions.
  const [session] = await read<SessionStateRow>(
    SESSION_MODEL,
    [sessionId],
    ["status"],
  );

  if (!session) {
    logger.error(
      "submitEvaluation",
      `Cannot read session ${sessionId} — access control issue or record deleted`,
    );
    throw new Error(
      `Không thể đọc trạng thái buổi học #${sessionId}. Kiểm tra quyền truy cập.`,
    );
  }

  logger.eval("submitEvaluation", `current status = "${session.status}"`);

  const emptySignal: IepCompletionSignal = {
    iep_just_completed: false,
    plan_id: false,
    remaining_sessions: [],
  };

  let signal: IepCompletionSignal = emptySignal;

  if (session.status === "scheduled") {
    logger.eval("submitEvaluation", "calling action_complete...");
    await callKw(SESSION_MODEL, "action_complete", [[sessionId]]);
    logger.eval("submitEvaluation", "calling action_submit_review...");
    const raw = await callKw(SESSION_MODEL, "action_submit_review", [[sessionId]]);
    if (raw && typeof raw === "object" && "iep_just_completed" in raw) {
      signal = raw as IepCompletionSignal;
    }
  } else if (session.status === "completed") {
    logger.eval("submitEvaluation", "calling action_submit_review...");
    const raw = await callKw(SESSION_MODEL, "action_submit_review", [[sessionId]]);
    if (raw && typeof raw === "object" && "iep_just_completed" in raw) {
      signal = raw as IepCompletionSignal;
    }
  } else {
    logger.warn(
      "submitEvaluation",
      `Unexpected status "${session.status}" — no workflow action called. Session may already be done.`,
    );
  }

  logger.eval("submitEvaluation", `DONE — session ${sessionId} finalized`);
  return signal;
}
