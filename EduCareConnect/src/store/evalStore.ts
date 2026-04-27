import { create } from "zustand";
import type { ResultInput, ObservationInput } from "../api/evalApi";

interface EvalState {
  sessionId: number | null;
  results: Map<number, ResultInput>;
  observation: ObservationInput;
  setSessionId: (id: number) => void;
  setResult: (objId: number, result: ResultInput) => void;
  setObservation: (obs: Partial<ObservationInput>) => void;
  reset: () => void;
}

const DEFAULT_OBS: ObservationInput = {
  attendance: "present",
  mood: "good",
  energy_level: "normal",
  engagement_level: "engaged",
  overall_performance: "good",
  notes: "",
};

export const useEvalStore = create<EvalState>((set) => ({
  sessionId: null,
  results: new Map(),
  observation: { ...DEFAULT_OBS },
  setSessionId: (id) =>
    set({ sessionId: id, results: new Map(), observation: { ...DEFAULT_OBS } }),
  setResult: (objId, result) =>
    set((s) => ({ results: new Map(s.results).set(objId, result) })),
  setObservation: (obs) =>
    set((s) => ({ observation: { ...s.observation, ...obs } })),
  reset: () =>
    set({
      sessionId: null,
      results: new Map(),
      observation: { ...DEFAULT_OBS },
    }),
}));
