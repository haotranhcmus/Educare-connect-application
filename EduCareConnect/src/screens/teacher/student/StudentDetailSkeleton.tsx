import React from "react";
import { ScrollView, View, StyleSheet, DimensionValue } from "react-native";
import {
  Skeleton,
  SkeletonItem,
  SkeletonCard,
} from "@components/common/Skeleton";

// Mỗi section: width của header label + danh sách độ rộng các dòng content
const SECTIONS: { headerWidth: number; lines: DimensionValue[] }[] = [
  { headerWidth: 110, lines: ["92%", "78%", "65%"] },
  { headerWidth: 92, lines: ["86%", "70%"] },
  { headerWidth: 134, lines: ["94%", "82%", "68%", "54%"] },
];

export function StudentDetailSkeleton() {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    >
      <Skeleton>
        {/* ─── Hero card ─────────────────────────────────────────────── */}
        <SkeletonCard style={styles.hero}>
          <View style={styles.heroAvatarWrap}>
            <SkeletonItem width={72} height={72} borderRadius={36} />
          </View>
          <SkeletonItem width={158} height={18} borderRadius={4} />
          <SkeletonItem width={96} height={12} borderRadius={4} marginTop={8} />
          <View style={styles.heroBadges}>
            <SkeletonItem width={58} height={20} borderRadius={6} />
            <SkeletonItem width={84} height={20} borderRadius={6} />
            <SkeletonItem width={70} height={20} borderRadius={6} />
          </View>
        </SkeletonCard>

        {/* ─── Quick stats row ───────────────────────────────────────── */}
        <View style={styles.statsRow}>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} style={styles.statCard}>
              <SkeletonItem width={28} height={18} borderRadius={4} />
              <SkeletonItem
                width={56}
                height={10}
                borderRadius={3}
                marginTop={6}
              />
            </SkeletonCard>
          ))}
        </View>

        {/* ─── Section cards ─────────────────────────────────────────── */}
        {SECTIONS.map((s, idx) => (
          <SkeletonCard key={idx} style={styles.section}>
            <View style={styles.sectionHeader}>
              <SkeletonItem width={20} height={20} borderRadius={6} />
              <SkeletonItem
                width={s.headerWidth}
                height={13}
                borderRadius={4}
              />
            </View>
            <View style={styles.divider} />
            {s.lines.map((w, li) => (
              <SkeletonItem
                key={li}
                width={w}
                height={11}
                borderRadius={4}
                marginTop={li === 0 ? 0 : 9}
              />
            ))}
          </SkeletonCard>
        ))}
      </Skeleton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  /* Hero */
  hero: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  heroAvatarWrap: {
    marginBottom: 14,
  },
  heroBadges: {
    flexDirection: "row",
    gap: 6,
    marginTop: 14,
  },
  /* Stats */
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  /* Section */
  section: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 12,
  },
});
