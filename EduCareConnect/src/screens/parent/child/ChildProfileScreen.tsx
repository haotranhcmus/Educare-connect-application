import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import PagerView from "react-native-pager-view";
import { LoadingOverlay } from "@components/common/LoadingOverlay";
import {
  StickyParallaxChildHeader,
  useStickyHeaderHeights,
} from "@components/parent/StickyParallaxChildHeader";
import { ChildProfileTab } from "@screens/parent/child/ChildProfileTab";
import { ChildProgressTab } from "@screens/parent/child/ChildProgressTab";
import { useStudentById } from "@hooks/useParent";
import { useParentStore } from "@store/parentStore";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

type ChildListStackParamList = {
  ChildList: undefined;
  ChildDetail: { studentId: number; studentName?: string };
  ChildIepHistory: { studentId: number; studentName?: string };
  ChildTimetable: { studentId: number; studentName?: string };
};
type Props = NativeStackScreenProps<ChildListStackParamList, "ChildDetail">;

const TAB_BAR_HEIGHT = 46;
const TABS = ["Hồ sơ", "Tiến độ IEP"] as const;

export function ChildProfileScreen({ route, navigation }: Props) {
  const theme = useTheme();
  // Source of truth: parent store. Falls back to route param on cold open.
  const selectedStudentIdStore = useParentStore((s) => s.selectedStudentId);
  const studentId = selectedStudentIdStore ?? route.params.studentId;
  const { data: student, isLoading } = useStudentById(studentId);
  const pagerRef = useRef<PagerView>(null);

  const [tabIndex, setTabIndex] = useState(0);

  const { collapsedHeight } = useStickyHeaderHeights();
  const contentInsetTop = collapsedHeight + TAB_BAR_HEIGHT;

  // Animated indicator
  const indicatorTranslateX = useSharedValue(0);
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorTranslateX.value }],
  }));

  const [tabBarWidth, setTabBarWidth] = useState(0);
  const indicatorWidth = tabBarWidth > 0 ? tabBarWidth / TABS.length : 0;

  useEffect(() => {
    if (indicatorWidth > 0) {
      indicatorTranslateX.value = withTiming(tabIndex * indicatorWidth, {
        duration: 220,
      });
    }
  }, [tabIndex, indicatorWidth, indicatorTranslateX]);

  function handleTabPress(idx: number) {
    pagerRef.current?.setPage(idx);
  }

  function handlePageSelected(e: { nativeEvent: { position: number } }) {
    setTabIndex(e.nativeEvent.position);
  }

  if (isLoading || !student) return <LoadingOverlay visible />;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* ── Static header ────────────────────────────────────── */}
      <StickyParallaxChildHeader onBackPress={() => navigation.goBack()} />

      {/* ── Tab bar — sits flush below the static header ─────── */}
      <View
        style={[styles.tabBarFloat, { top: collapsedHeight }]}
        onLayout={(e) => setTabBarWidth(e.nativeEvent.layout.width)}
      >
        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.outlineVariant,
            },
          ]}
        >
          {TABS.map((label, idx) => {
            const active = idx === tabIndex;
            return (
              <Pressable
                key={label}
                onPress={() => handleTabPress(idx)}
                style={styles.tabBtn}
                android_ripple={{
                  color: theme.colors.primaryContainer,
                  borderless: false,
                }}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: active
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant,
                      fontWeight: active ? "700" : "500",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
          {indicatorWidth > 0 ? (
            <Animated.View
              style={[
                styles.indicator,
                {
                  width: indicatorWidth,
                  backgroundColor: theme.colors.primary,
                },
                indicatorStyle,
              ]}
            />
          ) : null}
        </View>
      </View>

      {/* ── Pager ───────────────────────────────────────────── */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        <View key="profile" style={{ flex: 1 }}>
          <ChildProfileTab
            student={student}
            contentInsetTop={contentInsetTop}
          />
        </View>
        <View key="progress" style={{ flex: 1 }}>
          <ChildProgressTab
            studentId={student.id}
            navigation={navigation}
            detailRouteName="ChildIepPlanDetail"
            objectiveRouteName="ChildIepObjectiveDetail"
            contentInsetTop={contentInsetTop}
          />
        </View>
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBarFloat: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9,
    height: TAB_BAR_HEIGHT,
    elevation: 4,
  },
  tabBar: {
    flex: 1,
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: TAB_BAR_HEIGHT,
  },
  tabLabel: {
    fontSize: 13,
    letterSpacing: 0.15,
  },
  indicator: {
    position: "absolute",
    height: 3,
    bottom: 0,
    left: 0,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
});
