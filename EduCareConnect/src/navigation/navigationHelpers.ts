import React from "react";
import { StackActions } from "@react-navigation/native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { CustomHeader } from "@components/common/CustomHeader";

const BASE_HEADER_OPTIONS: NativeStackNavigationOptions = {
  headerShown: true,
  // CustomHeader renders the full header bar (background, title, back button, right actions)
  // and reads useSafeAreaInsets() from context — which App.tsx overrides to top=0 when the
  // OfflineBanner is visible, so there is no double status-bar padding in either state.
  header: (props) => React.createElement(CustomHeader, props as any),
};

export function useHeaderOptions(): NativeStackNavigationOptions {
  return BASE_HEADER_OPTIONS;
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
