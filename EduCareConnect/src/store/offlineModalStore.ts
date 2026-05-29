import { create } from "zustand";

interface OfflineModalState {
  visible: boolean;
  show: () => void;
  hide: () => void;
}

export const useOfflineModalStore = create<OfflineModalState>((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}));
