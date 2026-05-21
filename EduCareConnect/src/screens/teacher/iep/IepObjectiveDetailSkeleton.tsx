import React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import {
  Skeleton,
  SkeletonItem,
  SkeletonCard,
} from "@components/common/Skeleton";

/**
 * Granular skeletons cho IepObjectiveDetailScreen.
 * - `IepObjectiveDetailSkeleton` — full fallback cho Suspense.
 * - `IepObjectiveHeaderSkeleton` — code + status + name + description.
 * - `IepObjectiveMetricsSkeleton` — metric cards (4 ô số liệu).
 * - `IepObjectiveChartSkeleton` — chart area placeholder (~180px cao).
 * - `IepObjectiveHistorySkeleton` — bảng lịch sử (5 dòng).
 * - `IepObjectiveTeachingSkeleton` — info card phương pháp giảng dạy.
 */

/* ─── Header card ─────────────────────────────────────────────────────── */
export function IepObjectiveHeaderSkeleton() {
  return (
    <SkeletonCard style={styles.headerCard}>
      <View style={styles.headerRow}>
        <SkeletonItem width={86} height={18} borderRadius={5} />
        <SkeletonItem width={72} height={22} borderRadius={10} />
      </View>
      <SkeletonItem
        width="92%"
        height={14}
        borderRadius={4}
        marginTop={12}
      />
      <SkeletonItem
        width="68%"
        height={14}
        borderRadius={4}
        marginTop={6}
      />
      <SkeletonItem
        width="58%"
        height={11}
        borderRadius={3}
        marginTop={10}
      />
      <View style={styles.descDivider} />
      <SkeletonItem width="100%" height={11} borderRadius={4} />
      <SkeletonItem
        width="86%"
        height={11}
        borderRadius={4}
        marginTop={6}
      />
      <SkeletonItem
        width="72%"
        height={11}
        borderRadius={4}
        marginTop={6}
      />
    </SkeletonCard>
  );
}

/* ─── Section header (icon + title) ──────────────────────────────────── */
function SectionHeaderSkeleton({ width = 152 }: { width?: number }) {
  return (
    <View style={styles.sectionHeader}>
      <SkeletonItem width={18} height={18} borderRadius={5} />
      <SkeletonItem width={width} height={14} borderRadius={4} />
    </View>
  );
}

/* ─── Metrics card (4 metric cells trong 1 card) ─────────────────────── */
export function IepObjectiveMetricsSkeleton() {
  return (
    <View style={styles.section}>
      <SectionHeaderSkeleton width={140} />
      <SkeletonCard style={styles.metricsCard}>
        <View style={styles.metricsGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.metricCell}>
              <SkeletonItem width={36} height={20} borderRadius={4} />
              <SkeletonItem
                width={60}
                height={10}
                borderRadius={3}
                marginTop={6}
              />
            </View>
          ))}
        </View>
      </SkeletonCard>
    </View>
  );
}

/* ─── Progress chart placeholder ─────────────────────────────────────── */
export function IepObjectiveChartSkeleton() {
  return (
    <View style={[styles.section, { paddingHorizontal: 4 }]}>
      <SectionHeaderSkeleton width={172} />
      <SkeletonCard style={styles.chartCard}>
        <SkeletonItem width="100%" height={156} borderRadius={8} />
      </SkeletonCard>
    </View>
  );
}

/* ─── Session history table ──────────────────────────────────────────── */
export function IepObjectiveHistorySkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <View style={styles.section}>
      <SectionHeaderSkeleton width={184} />
      <SkeletonCard style={styles.historyCard}>
        {/* Table header */}
        <View style={styles.historyHeader}>
          <SkeletonItem width={60} height={10} borderRadius={3} />
          <SkeletonItem width={48} height={10} borderRadius={3} />
          <SkeletonItem width={40} height={10} borderRadius={3} />
        </View>
        <View style={styles.historyDivider} />
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <View key={i} style={styles.historyRow}>
            <SkeletonItem width={72} height={12} borderRadius={4} />
            <SkeletonItem width={56} height={12} borderRadius={4} />
            <SkeletonItem width={36} height={20} borderRadius={6} />
          </View>
        ))}
      </SkeletonCard>
    </View>
  );
}

/* ─── Teaching info (method + materials) ─────────────────────────────── */
export function IepObjectiveTeachingSkeleton() {
  return (
    <View style={styles.section}>
      <SectionHeaderSkeleton width={196} />
      <SkeletonCard style={styles.teachingCard}>
        <View style={styles.teachingRow}>
          <SkeletonItem width={82} height={11} borderRadius={3} />
          <SkeletonItem
            width="60%"
            height={12}
            borderRadius={4}
            marginLeft={8}
          />
        </View>
        <View style={[styles.teachingRow, { marginTop: 10 }]}>
          <SkeletonItem width={62} height={11} borderRadius={3} />
          <SkeletonItem
            width="50%"
            height={12}
            borderRadius={4}
            marginLeft={8}
          />
        </View>
      </SkeletonCard>
    </View>
  );
}

/* ─── Full-screen fallback ────────────────────────────────────────────── */
export function IepObjectiveDetailSkeleton() {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    >
      <Skeleton>
        <IepObjectiveHeaderSkeleton />
        <IepObjectiveMetricsSkeleton />
        <IepObjectiveChartSkeleton />
        <IepObjectiveHistorySkeleton rows={4} />
      </Skeleton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },

  /* Header */
  headerCard: {
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  descDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 10,
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

  /* Metrics */
  metricsCard: {
    padding: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metricCell: {
    width: "50%",
    paddingVertical: 8,
  },

  /* Chart */
  chartCard: {
    padding: 12,
  },

  /* History */
  historyCard: {
    padding: 12,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  historyDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 4,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },

  /* Teaching */
  teachingCard: {
    padding: 12,
    gap: 6,
  },
  teachingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
