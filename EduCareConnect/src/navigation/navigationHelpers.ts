import { StackActions } from "@react-navigation/native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

/** Shared green gradient-style header for all stack navigators. */
export const GRADIENT_HEADER_OPTIONS: NativeStackNavigationOptions = {
  headerShown: true,
  headerTintColor: "#FFFFFF",
  headerTitleStyle: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
    fontSize: 17,
  },
  headerStyle: {
    backgroundColor: "#2E7D32",
  },
};

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
