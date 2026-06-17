import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Skeleton, SkeletonItem } from "@components/common/Skeleton";

export function ParentHomeScreenSkeleton() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Skeleton>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* ── Gradient header ── */}
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + 12, backgroundColor: "#2E7D32" },
          ]}
        >
          {/* Greeting row */}
          <View style={styles.greetRow}>
            <SkeletonItem width={42} height={42} borderRadius={21} />
            <View style={{ flex: 1, marginLeft: 12, gap: 8 }}>
              <SkeletonItem width={90} height={11} borderRadius={6} />
              <SkeletonItem width={150} height={16} borderRadius={6} />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <SkeletonItem width={24} height={24} borderRadius={12} />
              <SkeletonItem width={24} height={24} borderRadius={12} />
            </View>
          </View>

          {/* Stats inside header */}
          <View style={styles.statsBlock}>
            <SkeletonItem width={60} height={14} borderRadius={6} />
            <SkeletonItem width={60} height={14} borderRadius={6} />
          </View>

          {/* Extra bottom space for child card overlap */}
          <View style={{ height: 36 }} />
        </View>

        {/* ── Child card — floats over header ── */}
        <View style={styles.childCardOuter}>
          <View
            style={[
              styles.childCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.childCardTop}>
              <SkeletonItem width={52} height={52} borderRadius={26} />
              <View style={{ flex: 1, marginLeft: 12, gap: 8 }}>
                <SkeletonItem width={140} height={16} borderRadius={6} />
                <SkeletonItem width={100} height={12} borderRadius={6} />
              </View>
              <SkeletonItem width={70} height={30} borderRadius={10} />
            </View>
          </View>
        </View>

        {/* ── Quick action buttons ── */}
        <View style={styles.quickRow}>
          {[0, 1, 2].map((i) => (
            <SkeletonItem
              key={i}
              style={{ flex: 1, height: 84, borderRadius: 14 }}
            />
          ))}
        </View>

        {/* ── Latest session placeholder ── */}
        <View style={styles.section}>
          <SkeletonItem width={160} height={15} borderRadius={6} />
          <SkeletonItem width="100%" height={80} borderRadius={16} />
        </View>
      </View>
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 0,
    gap: 16,
  },
  greetRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  statsBlock: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  childCardOuter: {
    marginHorizontal: 16,
    marginTop: -28,
    marginBottom: 14,
    borderRadius: 18,
    elevation: 6,
  },
  childCard: {
    borderRadius: 18,
    overflow: "hidden",
  },
  childCardTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  quickRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  section: {
    paddingHorizontal: 16,
    gap: 10,
  },
});
