import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import {
  Skeleton,
  SkeletonItem,
  SkeletonCard,
} from "@components/common/Skeleton";

/**
 * Granular skeletons cho ReportDetailScreen (teacher view).
 * Exports:
 * - `ReportDetailSkeleton` — full fallback cho Suspense.
 * - `ReportHeroSkeleton` — hero gradient card (icon + title + student + date + status badges).
 * - `ReportSessionInfoSkeleton` — info card với 4 rows: student/date/duration/accuracy.
 * - `ReportObjectivesSkeleton` — section header + N objective cards.
 * - `ReportObservationsSkeleton` — info card với 5 rows quan sát.
 * - `ReportPhotosSkeleton` — grid 90x90 thumbnails.
 * - `ReportContentCardSkeleton` — content card (icon + label + body) — dùng cho REPORT_FIELDS lặp.
 * - `ReportActionsSkeleton` — 2 button (edit + send).
 */

/* ─── Section label (icon + title) ───────────────────────────────────── */
function SectionLabelSkeleton({ width = 160 }: { width?: number }) {
  return (
    <View style={styles.sectionLabel}>
      <SkeletonItem width={18} height={18} borderRadius={5} />
      <SkeletonItem width={width} height={14} borderRadius={4} />
    </View>
  );
}

/* ─── Hero card (gradient) ───────────────────────────────────────────── */
export function ReportHeroSkeleton() {
  return (
    <SkeletonCard style={styles.heroCard}>
      <View style={styles.heroGrad}>
        <View style={styles.heroTop}>
          <SkeletonItem width={46} height={46} borderRadius={13} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonItem width="80%" height={14} borderRadius={4} />
            <SkeletonItem width="56%" height={11} borderRadius={3} />
          </View>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroBottom}>
          <SkeletonItem width={92} height={22} borderRadius={8} />
          <SkeletonItem width={78} height={22} borderRadius={11} />
        </View>
      </View>
    </SkeletonCard>
  );
}

/* ─── Session info ───────────────────────────────────────────────────── */
export function ReportSessionInfoSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View style={styles.section}>
      <SectionLabelSkeleton width={156} />
      <SkeletonCard style={styles.infoCard}>
        {Array.from({ length: rows }).map((_, i) => (
          <View key={i}>
            <View style={styles.infoRow}>
              <SkeletonItem width={16} height={16} borderRadius={4} />
              <SkeletonItem
                width={82}
                height={11}
                borderRadius={3}
                marginLeft={10}
              />
              <SkeletonItem
                width={`${56 - i * 4}%` as `${number}%`}
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
export function ReportObjectivesSkeleton({ count = 2 }: { count?: number }) {
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

/* ─── Observations section ───────────────────────────────────────────── */
export function ReportObservationsSkeleton() {
  return (
    <View style={styles.section}>
      <SectionLabelSkeleton width={132} />
      <SkeletonCard style={styles.infoCard}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i}>
            <View style={styles.infoRow}>
              <SkeletonItem width={16} height={16} borderRadius={4} />
              <SkeletonItem
                width={76}
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
            {i < 3 && <View style={styles.rowDivider} />}
          </View>
        ))}
      </SkeletonCard>
    </View>
  );
}

/* ─── Photos grid ────────────────────────────────────────────────────── */
export function ReportPhotosSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.section}>
      <SectionLabelSkeleton width={120} />
      <SkeletonCard style={styles.photosCard}>
        <View style={styles.photoGrid}>
          {Array.from({ length: count }).map((_, i) => (
            <SkeletonItem key={i} width={90} height={90} borderRadius={8} />
          ))}
        </View>
      </SkeletonCard>
    </View>
  );
}

/* ─── Content card (1 REPORT_FIELD entry) ────────────────────────────── */
export function ReportContentCardSkeleton({
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
            <SkeletonItem width={140} height={13} borderRadius={4} />
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

/* ─── Actions (edit + send) ──────────────────────────────────────────── */
export function ReportActionsSkeleton() {
  return (
    <View style={styles.actions}>
      <SkeletonItem
        width="48%"
        height={44}
        borderRadius={22}
      />
      <SkeletonItem
        width="48%"
        height={44}
        borderRadius={22}
      />
    </View>
  );
}

/* ─── Full-screen fallback ────────────────────────────────────────────── */
export function ReportDetailSkeleton() {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    >
      <Skeleton>
        <ReportHeroSkeleton />
        <ReportSessionInfoSkeleton rows={4} />
        <ReportContentCardSkeleton count={2} />
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 12,
    backgroundColor: "rgba(46,125,50,0.08)",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  heroBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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

  /* Photos */
  photosCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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

  /* Actions */
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    justifyContent: "space-between",
  },
});
