import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import {
  Skeleton,
  SkeletonItem,
  SkeletonCard,
} from "@components/common/Skeleton";

/**
 * Granular skeletons cho ParentReportDetailScreen.
 * Exports:
 * - `ParentReportDetailSkeleton` — full fallback cho Suspense.
 * - `ParentReportHeroSkeleton` — hero gradient card (unread banner + icon + title + student + status badges + meta).
 * - `ParentReportObservationsSkeleton` — quan sát buổi học (5 rows).
 * - `ParentReportObjectivesSkeleton` — mục tiêu đã học (N cards).
 * - `ParentReportContentCardSkeleton` — content card lặp cho REPORT_FIELDS_PARENT.
 */

/* ─── Section label ──────────────────────────────────────────────────── */
function SectionLabelSkeleton({ width = 160 }: { width?: number }) {
  return (
    <View style={styles.sectionLabel}>
      <SkeletonItem width={18} height={18} borderRadius={5} />
      <SkeletonItem width={width} height={14} borderRadius={4} />
    </View>
  );
}

/* ─── Hero (gradient + unread banner + badges + meta) ────────────────── */
export function ParentReportHeroSkeleton() {
  return (
    <SkeletonCard style={styles.heroCard}>
      {/* Gradient area */}
      <View style={styles.heroGrad}>
        {/* Unread banner pill */}
        <SkeletonItem
          width={156}
          height={24}
          borderRadius={8}
          marginBottom={12}
        />

        {/* Main row: icon + label/title/student */}
        <View style={styles.heroMain}>
          <SkeletonItem width={38} height={38} borderRadius={11} />
          <View style={{ flex: 1, gap: 4 }}>
            <SkeletonItem width={92} height={10} borderRadius={3} />
            <SkeletonItem width="76%" height={14} borderRadius={4} />
            <SkeletonItem width="44%" height={11} borderRadius={3} />
          </View>
        </View>

        {/* Status + performance badges */}
        <View style={styles.heroBadges}>
          <SkeletonItem width={80} height={22} borderRadius={10} />
          <SkeletonItem width={92} height={22} borderRadius={10} />
        </View>
      </View>

      {/* Meta rows below gradient */}
      <View style={styles.heroMeta}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.metaRow}>
            <SkeletonItem width={15} height={15} borderRadius={4} />
            <SkeletonItem
              width={`${56 + i * 6}%` as `${number}%`}
              height={12}
              borderRadius={4}
            />
          </View>
        ))}
      </View>
    </SkeletonCard>
  );
}

/* ─── Observations card (5 rows) ─────────────────────────────────────── */
export function ParentReportObservationsSkeleton({
  rows = 5,
}: {
  rows?: number;
}) {
  return (
    <View style={styles.section}>
      <SectionLabelSkeleton width={156} />
      <SkeletonCard style={styles.infoCard}>
        {Array.from({ length: rows }).map((_, i) => (
          <View key={i}>
            <View style={styles.infoRow}>
              <SkeletonItem width={16} height={16} borderRadius={4} />
              <SkeletonItem
                width={84}
                height={11}
                borderRadius={3}
                marginLeft={10}
              />
              <SkeletonItem
                width={`${44 + i * 6}%` as `${number}%`}
                height={12}
                borderRadius={4}
                marginLeft={12}
              />
            </View>
            {i < rows - 1 && <View style={styles.rowDivider} />}
          </View>
        ))}
      </SkeletonCard>
    </View>
  );
}

/* ─── Objectives section ─────────────────────────────────────────────── */
export function ParentReportObjectivesSkeleton({
  count = 2,
}: {
  count?: number;
}) {
  return (
    <View style={styles.section}>
      <SectionLabelSkeleton width={172} />
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
          <View style={styles.progressTrack}>
            <SkeletonItem width="55%" height={6} borderRadius={3} />
          </View>
        </SkeletonCard>
      ))}
    </View>
  );
}

/* ─── Content card (1 REPORT_FIELDS_PARENT entry) ────────────────────── */
export function ParentReportContentCardSkeleton({
  count = 2,
}: {
  count?: number;
}) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} style={styles.contentCard}>
          <View style={styles.contentHeader}>
            <SkeletonItem width={28} height={28} borderRadius={8} />
            <SkeletonItem width={132} height={13} borderRadius={4} />
          </View>
          <SkeletonItem
            width="100%"
            height={12}
            borderRadius={4}
            marginTop={10}
          />
          <SkeletonItem
            width="92%"
            height={12}
            borderRadius={4}
            marginTop={6}
          />
          <SkeletonItem
            width="76%"
            height={12}
            borderRadius={4}
            marginTop={6}
          />
        </SkeletonCard>
      ))}
    </View>
  );
}

/* ─── Full-screen fallback ────────────────────────────────────────────── */
export function ParentReportDetailSkeleton() {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    >
      <Skeleton>
        <ParentReportHeroSkeleton />
        <ParentReportObservationsSkeleton rows={4} />
        <ParentReportContentCardSkeleton count={2} />
      </Skeleton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 48,
  },

  /* Section */
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },

  /* Hero */
  heroCard: {
    marginBottom: 20,
    overflow: "hidden",
  },
  heroGrad: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: "rgba(46,125,50,0.08)",
  },
  heroMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroBadges: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  heroMeta: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  /* Info card */
  infoCard: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.06)",
  },

  /* Objective */
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

  /* Content card */
  contentCard: {
    padding: 14,
    marginBottom: 10,
  },
  contentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
