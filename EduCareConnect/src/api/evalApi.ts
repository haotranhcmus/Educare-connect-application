import { callKw, create, read, searchRead, write } from "./odooClient";
import { logger } from "../utils/logger";

const SESSION_MODEL = "educare.session.log";
const RESULT_MODEL = "educare.session.result";

export interface ResultInput {
  objective_id: number;
  result_type: string;
  correct_trials: number;
  total_trials: number;
  prompt_level_used: string;
  phase: string;
  notes?: string;
}

export interface ObservationInput {
  attendance: string;
  mood: string;
  energy_level: string;
  engagement_level: string;
  overall_performance: string;
  notes?: string;
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
 * Submit all results + observations and finalize session
 * Steps: create results → update session observations → confirm (status=done)
 */
export async function submitEvaluation(
  sessionId: number,
  results: ResultInput[],
  observation: ObservationInput,
): Promise<boolean> {
  logger.eval("submitEvaluation", "start", {
    sessionId,
    resultCount: results.length,
    observation: {
      attendance: observation.attendance,
      mood: observation.mood,
    },
  });

  // 1. Upsert session results by objective (avoid duplicate rows per objective/session)
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
    const vals = {
      session_id: sessionId,
      objective_id: r.objective_id,
      result_type: r.result_type,
      correct_trials: r.correct_trials,
      total_trials: r.total_trials,
      prompt_level_used: r.prompt_level_used,
      phase: r.phase,
      notes: r.notes || "",
    };

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

  // 2. Update session with observations
  logger.eval(
    "submitEvaluation",
    "step 2 — writing observations to session...",
  );
  await write(SESSION_MODEL, [sessionId], {
    attendance: observation.attendance,
    mood: observation.mood,
    energy_level: observation.energy_level,
    engagement_level: observation.engagement_level,
    overall_performance: observation.overall_performance,
    notes: observation.notes || "",
  });

  // 3. Advance workflow to done via real backend actions.
  logger.eval("submitEvaluation", "step 3 — reading current session status...");
  const [session] = await read<SessionStateRow>(
    SESSION_MODEL,
    [sessionId],
    ["status"],
  );

  if (!session) {
    logger.error(
      "submitEvaluation",
      `Cannot read session ${sessionId} after write — access control issue or record deleted`,
    );
    throw new Error(
      `Không thể đọc trạng thái buổi học #${sessionId} sau khi ghi. Kiểm tra quyền truy cập.`,
    );
  }

  logger.eval("submitEvaluation", `current status = "${session.status}"`);

  if (session.status === "scheduled") {
    logger.eval("submitEvaluation", "calling action_complete...");
    await callKw(SESSION_MODEL, "action_complete", [[sessionId]]);
    logger.eval("submitEvaluation", "calling action_submit_review...");
    await callKw(SESSION_MODEL, "action_submit_review", [[sessionId]]);
  } else if (session.status === "completed") {
    logger.eval("submitEvaluation", "calling action_submit_review...");
    await callKw(SESSION_MODEL, "action_submit_review", [[sessionId]]);
  } else {
    logger.warn(
      "submitEvaluation",
      `Unexpected status "${session.status}" — no workflow action called. Session may already be done.`,
    );
  }

  logger.eval("submitEvaluation", `DONE — session ${sessionId} finalized`);
  return true;
}
