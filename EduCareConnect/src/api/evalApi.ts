import { callKw, create, read, searchRead, write } from "./odooClient";

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
  // 1. Upsert session results by objective (avoid duplicate rows per objective/session)
  const existingRows = await searchRead<SessionResultRow>(
    RESULT_MODEL,
    [["session_id", "=", sessionId]],
    ["id", "objective_id"],
    { limit: 500 },
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
      await write(RESULT_MODEL, [existingId], vals);
    } else {
      await create(RESULT_MODEL, vals);
    }
  }

  // 2. Update session with observations
  await write(SESSION_MODEL, [sessionId], {
    attendance: observation.attendance,
    mood: observation.mood,
    energy_level: observation.energy_level,
    engagement_level: observation.engagement_level,
    overall_performance: observation.overall_performance,
    notes: observation.notes || "",
  });

  // 3. Advance workflow to done via real backend actions.
  const [session] = await read<SessionStateRow>(
    SESSION_MODEL,
    [sessionId],
    ["status"],
  );

  if (session?.status === "scheduled") {
    await callKw(SESSION_MODEL, "action_complete", [[sessionId]]);
    await callKw(SESSION_MODEL, "action_submit_review", [[sessionId]]);
  } else if (session?.status === "completed") {
    await callKw(SESSION_MODEL, "action_submit_review", [[sessionId]]);
  }

  return true;
}
