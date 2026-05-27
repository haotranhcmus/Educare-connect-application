import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import {
  Skeleton,
  SkeletonItem,
  SkeletonCard,
} from "@components/common/Skeleton";

/**
 * Granular skeletons cho SessionDetailScreen.
 * Mỗi sub-query có một skeleton riêng → load độc lập, không block toàn màn hình.
 *
 * Cách dùng:
 * - `SessionDetailSkeleton` — full fallback cho Suspense bao session detail query.
 * - `SessionInfoCardSkeleton` — đã chứa trong full (không cần dùng riêng).
 * - `SessionObjectivesSkeleton` — fallback cho objective list khi `useSessionObjectives.isLoading`.
 * - `SessionResultsSkeleton` — fallback cho result list khi `useSessionResults.isLoading`.
 * - `SessionActionsSkeleton` — placeholder cho hàng action buttons.
 */

/* ─── Hero info card (gradient header + student + info grid) ─────────── */
export function SessionInfoCardSkeleton() {
  return (
    <SkeletonCard style={styles.infoCard}>
      {/* Gradient header */}
      <View style={styles.heroHeader}>
        <View style={styles.heroTimeRow}>
          <SkeletonItem width={140} height={26} borderRadius={6} />
          <SkeletonItem width={62} height={22} borderRadius={8} />
        </View>
        <View style={styles.heroMeta}>
          <SkeletonItem width={110} height={11} borderRadius={3} />
          <SkeletonItem width={72} height={20} borderRadius={10} />
        </View>
      </View>

      {/* Student row */}
      <View style={styles.studentRow}>
        <SkeletonItem width={46} height={46} borderRadius={23} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonItem width="48%" height={14} borderRadius={4} />
          <SkeletonItem width="20%" height={10} borderRadius={3} />
        </View>
      </View>

      <View style={styles.divider} />

      {/* Info grid 2x2 */}
      <View style={styles.infoGrid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.infoCell}>
            <SkeletonItem width={28} height={28} borderRadius={9} />
            <View style={{ flex: 1, gap: 4 }}>
              <SkeletonItem width="60%" height={9} borderRadius={3} />
              <SkeletonItem width="80%" height={12} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>
    </SkeletonCard>
  );
}

/* ─── Objectives section ─────────────────────────────────────────────── */
export function SessionObjectivesSkeleton({ count = 2 }: { count?: number }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <SkeletonItem width={18} height={18} borderRadius={5} />
        <SkeletonItem width={168} height={14} borderRadius={4} />
      </View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} style={styles.objectiveCard}>
          <View style={styles.objectiveTop}>
            <SkeletonItem width={68} height={20} borderRadius={6} />
            <SkeletonItem width={56} height={20} borderRadius={10} />
          </View>
          <SkeletonItem
            width="86%"
            height={13}
            borderRadius={4}
            marginTop={10}
          />
          <SkeletonItem
            width="62%"
            height={11}
            borderRadius={4}
            marginTop={6}
          />
          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <SkeletonItem width="55%" height={6} borderRadius={3} />
          </View>
        </SkeletonCard>
      ))}
    </View>
  );
}

/* ─── Results section (chỉ hiện khi session.status === "done") ───────── */
export function SessionResultsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <SkeletonItem width={18} height={18} borderRadius={5} />
        <SkeletonItem width={172} height={14} borderRadius={4} />
      </View>

      {/* Average card */}
      <SkeletonCard style={styles.avgCard}>
        <SkeletonItem width="48%" height={13} borderRadius={4} />
      </SkeletonCard>

      {/* Result cards */}
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} style={styles.resultCard}>
          <View style={styles.resultTop}>
            <SkeletonItem
              width="60%"
              height={13}
              borderRadius={4}
            />
            <SkeletonItem width={48} height={22} borderRadius={6} />
          </View>
          <View style={styles.progressTrack}>
            <SkeletonItem width="72%" height={6} borderRadius={3} />
          </View>
          <SkeletonItem
            width="40%"
            height={10}
            borderRadius={3}
            marginTop={8}
          />
        </SkeletonCard>
      ))}
    </View>
  );
}

/* ─── Action buttons row ─────────────────────────────────────────────── */
export function SessionActionsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <View style={styles.actions}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem
          key={i}
          width="100%"
          height={44}
          borderRadius={22}
          marginTop={i === 0 ? 0 : 8}
        />
      ))}
    </View>
  );
}

/* ─── Full-screen fallback (compose tất cả sub-skeletons) ────────────── */
export function SessionDetailSkeleton() {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    >
      <Skeleton>
        <SessionInfoCardSkeleton />
        <SessionObjectivesSkeleton count={2} />
        <SessionActionsSkeleton count={2} />
      </Skeleton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },

  /* Info card */
  infoCard: {
    overflow: "hidden",
    marginBottom: 20,
  },
  heroHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: "rgba(46,125,50,0.08)",
  },
  heroTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginHorizontal: 16,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "50%",
    paddingVertical: 6,
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

  /* Objective card */
  objectiveCard: {
    padding: 14,
    marginBottom: 10,
  },
  objectiveTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.04)",
    overflow: "hidden",
    marginTop: 10,
  },

  /* Result */
  avgCard: {
    padding: 14,
    marginBottom: 8,
    backgroundColor: "rgba(46,125,50,0.06)",
  },
  resultCard: {
    padding: 14,
    marginBottom: 8,
  },
  resultTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  /* Actions */
  actions: {
    marginTop: 4,
    marginBottom: 24,
  },
});
