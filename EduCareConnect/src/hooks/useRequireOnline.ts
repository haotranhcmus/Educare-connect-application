import { onlineManager } from "@tanstack/react-query";
import { useOfflineModalStore } from "@store/offlineModalStore";

/**
 * Returns a guard function. Call it with an action callback:
 *   const requireOnline = useRequireOnline();
 *   requireOnline(() => navigation.navigate("ReportCreate"));
 *
 * If the device is online the action runs immediately; otherwise the global
 * OfflineModal is shown and the action is dropped — the user must reconnect
 * and tap the action again.
 */
export function useRequireOnline(): (action: () => void) => void {
  const show = useOfflineModalStore((s) => s.show);
  return (action) => {
    if (onlineManager.isOnline()) {
      action();
    } else {
      show();
    }
  };
}
