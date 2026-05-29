import { create } from "zustand";
import type { ResultInput } from "@api/evalApi";

interface EvalState {
  sessionId: number | null;
  results: Map<number, ResultInput>;
  /**
   * Objectives the teacher chose to skip in this session. Skipped IDs are
   * stripped from session.objective_ids on submit so they leave no trace in
   * the session history. Cleared on session change / reset.
   */
  skippedObjectiveIds: Set<number>;
  setSessionId: (id: number) => void;
  setResult: (objId: number, result: ResultInput) => void;
  skipObjective: (objId: number) => void;
  reset: () => void;
}

export const useEvalStore = create<EvalState>((set) => ({
  sessionId: null,
  results: new Map(),
  skippedObjectiveIds: new Set(),
  setSessionId: (id) =>
    set({ sessionId: id, results: new Map(), skippedObjectiveIds: new Set() }),
  setResult: (objId, result) =>
    set((s) => ({ results: new Map(s.results).set(objId, result) })),
  skipObjective: (objId) =>
    set((s) => {
      const next = new Set(s.skippedObjectiveIds);
      next.add(objId);
      // Drop any draft result for this objective so it doesn't get submitted.
      const results = new Map(s.results);
      results.delete(objId);
      return { skippedObjectiveIds: next, results };
    }),
  reset: () =>
    set({
      sessionId: null,
      results: new Map(),
      skippedObjectiveIds: new Set(),
    }),
}));
