import { useMemo } from "react";
import { StackActions } from "@react-navigation/native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { useOnlineStatus } from "@hooks/useOnlineStatus";

// ── Brand header colors (solid, not gradient) ─────────────────────────
const HEADER_BG = "#2E7D32";
const HEADER_FG = "#FFFFFF";

const BASE_HEADER_OPTIONS: NativeStackNavigationOptions = {
  headerShown: true,
  headerTintColor: HEADER_FG,
  headerTitleStyle: {
    color: HEADER_FG,
    fontWeight: "700" as const,
    fontSize: 17,
  },
  headerStyle: {
    backgroundColor: HEADER_BG,
  },
  // contentStyle: { marginTop: -30 }, // Remove default top padding to align with OfflineBanner
};

/**
 * Returns header options for every stack navigator.
 *
 * When offline, OfflineBanner (rendered above AppNavigator in App.tsx) wraps
 * itself in a SafeAreaView with `edges={["top"]}`, so it already consumes the
 * status-bar inset. The native header (react-native-screens) computes its own
 * status-bar padding from the device inset by default, so without an override
 * the inset would be counted twice and push the header down further.
 *
 * `headerStatusBarHeight: 0` tells the native header to skip that padding for
 * the duration the banner is visible. As soon as the device is back online and
 * the banner unmounts, the value returns to the default (uses inset).
 */
export function useHeaderOptions(): NativeStackNavigationOptions {
  const isOnline = useOnlineStatus();
  return useMemo(
    () =>
      isOnline
        ? BASE_HEADER_OPTIONS
        : { ...BASE_HEADER_OPTIONS, headerStatusBarHeight: 0 },
    [isOnline],
  );
}

/**
 * When the user re-taps a tab whose stack has been pushed deeper than its
 * root, pop back to the root. When the stack is already at root, fall through
 * to the default tabPress behaviour (focus the tab).
 */
export function popToTopOnTabPress({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  return {
    tabPress: (e: { preventDefault: () => void }) => {
      const r = route as any;
      if (r.state && r.state.index > 0) {
        e.preventDefault();
        navigation.dispatch({
          ...StackActions.popToTop(),
          target: r.state.key,
        });
        navigation.navigate(route.name);
      }
    },
  };
}
