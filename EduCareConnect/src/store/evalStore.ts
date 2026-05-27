import { create } from "zustand";
import type { ResultInput } from "@api/evalApi";

interface EvalState {
  sessionId: number | null;
  results: Map<number, ResultInput>;
  setSessionId: (id: number) => void;
  setResult: (objId: number, result: ResultInput) => void;
  reset: () => void;
}

export const useEvalStore = create<EvalState>((set) => ({
  sessionId: null,
  results: new Map(),
  setSessionId: (id) => set({ sessionId: id, results: new Map() }),
  setResult: (objId, result) =>
    set((s) => ({ results: new Map(s.results).set(objId, result) })),
  reset: () => set({ sessionId: null, results: new Map() }),
}));
