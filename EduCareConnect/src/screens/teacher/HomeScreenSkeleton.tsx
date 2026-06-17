import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Skeleton, SkeletonItem } from "@components/common/Skeleton";

export function HomeScreenSkeleton() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Skeleton>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* ── Gradient header block ── */}
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + 16, backgroundColor: "#2E7D32" },
          ]}
        >
          {/* Avatar + name row */}
          <View style={styles.headerRow}>
            <SkeletonItem width={44} height={44} borderRadius={22} />
            <View style={{ flex: 1, marginLeft: 12, gap: 8 }}>
              <SkeletonItem width={80} height={11} borderRadius={6} />
              <SkeletonItem width={140} height={16} borderRadius={6} />
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <SkeletonItem width={24} height={24} borderRadius={12} />
              <SkeletonItem width={24} height={24} borderRadius={12} />
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <SkeletonItem width={80} height={14} borderRadius={6} />
            <SkeletonItem width={80} height={14} borderRadius={6} />
          </View>
        </View>

        {/* ── Session carousel placeholder ── */}
        <View style={styles.section}>
          <SkeletonItem width={160} height={16} borderRadius={6} style={styles.sectionTitle} />
          <SkeletonItem
            width="100%"
            height={110}
            borderRadius={16}
          />
        </View>

        {/* ── Week/month stats cards ── */}
        <View style={[styles.section, styles.statsCards]}>
          <SkeletonItem style={{ flex: 1, height: 80, borderRadius: 14 }} />
          <SkeletonItem style={{ flex: 1, height: 80, borderRadius: 14 }} />
        </View>

        {/* ── Student list placeholder ── */}
        <View style={styles.section}>
          <SkeletonItem width={120} height={16} borderRadius={6} style={styles.sectionTitle} />
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.studentRow}>
              <SkeletonItem width={44} height={44} borderRadius={22} />
              <View style={{ flex: 1, marginLeft: 12, gap: 8 }}>
                <SkeletonItem width={130} height={14} borderRadius={6} />
                <SkeletonItem width={90} height={11} borderRadius={6} />
              </View>
              <SkeletonItem width={60} height={22} borderRadius={10} />
            </View>
          ))}
        </View>
      </View>
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 10,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  statsCards: {
    flexDirection: "row",
    gap: 12,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
});
