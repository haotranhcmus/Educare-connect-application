import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import {
  Skeleton,
  SkeletonItem,
  SkeletonCard,
} from "@components/common/Skeleton";

/**
 * Granular skeletons cho IepPlanDetailScreen.
 * - `IepPlanDetailSkeleton` — full fallback cho Suspense.
 * - `IepPlanHeaderSkeleton` — gradient header + meta rows (period, teacher, supervisor, version).
 * - `IepPlanGoalsSkeleton` — section header + 2-3 goal cards (có thể expand).
 */

/* ─── Hero header card ────────────────────────────────────────────────── */
export function IepPlanHeaderSkeleton() {
  return (
    <SkeletonCard style={styles.planCard}>
      {/* Gradient banner */}
      <View style={styles.gradHeader}>
        <SkeletonItem width={38} height={38} borderRadius={11} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonItem width="62%" height={14} borderRadius={4} />
          <SkeletonItem width="44%" height={11} borderRadius={3} />
        </View>
        <SkeletonItem width={64} height={22} borderRadius={10} />
      </View>

      {/* Meta rows */}
      <View style={styles.metaSection}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.metaRow}>
            <SkeletonItem width={15} height={15} borderRadius={4} />
            <SkeletonItem
              width={`${72 - i * 8}%` as `${number}%`}
              height={12}
              borderRadius={4}
            />
          </View>
        ))}
      </View>
    </SkeletonCard>
  );
}

/* ─── Section header (icon + title) ──────────────────────────────────── */
function SectionHeaderSkeleton({ width = 180 }: { width?: number }) {
  return (
    <View style={styles.sectionHeader}>
      <SkeletonItem width={18} height={18} borderRadius={5} />
      <SkeletonItem width={width} height={14} borderRadius={4} />
    </View>
  );
}

/* ─── Goals list (each goal = collapsible card với objectives bên trong) ─ */
export function IepPlanGoalsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.section}>
      <SectionHeaderSkeleton width={188} />
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonItem width="86%" height={14} borderRadius={4} />
              <SkeletonItem width="48%" height={11} borderRadius={3} />
            </View>
            <SkeletonItem width={16} height={16} borderRadius={4} />
          </View>
          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <SkeletonItem
              width={`${48 + i * 12}%` as `${number}%`}
              height={6}
              borderRadius={3}
            />
          </View>
          <View style={styles.goalFooter}>
            <SkeletonItem width={68} height={20} borderRadius={6} />
            <SkeletonItem width={88} height={10} borderRadius={3} />
          </View>
        </SkeletonCard>
      ))}
    </View>
  );
}

/* ─── Full-screen fallback ────────────────────────────────────────────── */
export function IepPlanDetailSkeleton() {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    >
      <Skeleton>
        <IepPlanHeaderSkeleton />
        <IepPlanGoalsSkeleton count={3} />
      </Skeleton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },

  /* Plan card */
  planCard: {
    marginBottom: 16,
    overflow: "hidden",
  },
  gradHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "rgba(46,125,50,0.08)",
  },
  metaSection: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  /* Section */
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },

  /* Goal card */
  goalCard: {
    padding: 14,
    marginBottom: 10,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.04)",
    overflow: "hidden",
  },
  goalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
});
