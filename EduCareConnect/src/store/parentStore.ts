import { create } from "zustand";

interface ParentState {
  selectedStudentId: number | null;
  selectedStudent: any | null;
  setSelectedStudent: (student: any) => void;
  clearSelectedStudent: () => void;
}

export const useParentStore = create<ParentState>((set) => ({
  selectedStudentId: null,
  selectedStudent: null,
  setSelectedStudent: (student) =>
    set({ selectedStudentId: student?.id ?? null, selectedStudent: student }),
  clearSelectedStudent: () =>
    set({ selectedStudentId: null, selectedStudent: null }),
}));
