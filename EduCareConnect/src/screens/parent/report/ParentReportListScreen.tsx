import React, { useState, useMemo } from "react";
import {
  View,
  SectionList,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Chip, Text, useTheme } from "react-native-paper";
import Animated from "react-native-reanimated";
import { ParentReportCard } from "@components/parent/ParentReportCard";
import { EmptyState } from "@components/common/EmptyState";
import ReportPlaceholderJson from "@assets/placeholder/json/report-placeholder.json";
import { LoadingOverlay } from "@components/common/LoadingOverlay";
import {
  StickyParallaxChildHeader,
  useStickyHeaderHeights,
} from "@components/parent/StickyParallaxChildHeader";
import { useParentReports } from "@hooks/useParent";
import { useParentStore } from "@store/parentStore";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ParentReportStackParamList } from "@navigation/types";

type Props = NativeStackScreenProps<
  ParentReportStackParamList,
  "ParentReportList"
>;

const AnimatedSectionList =
  Animated.createAnimatedComponent(SectionList);

const FILTER_CHIPS = [
  { key: "all", label: "Tất cả" },
  { key: "unread", label: "Chưa đọc" },
];

export function ParentReportListScreen({ navigation }: Props) {
  const theme = useTheme();
  const { selectedStudentId } = useParentStore();
  const {
    data: reports = [],
    isLoading,
    refetch,
  } = useParentReports(selectedStudentId ?? undefined);
  const [filter, setFilter] = useState("all");

  const { collapsedHeight } = useStickyHeaderHeights();

  const filtered = useMemo(() => {
    if (filter === "unread")
      return reports.filter((r: any) => r.status === "sent");
    return reports;
  }, [reports, filter]);

  const sections = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    for (const r of filtered) {
      const d = new Date(r.report_date + "T00:00:00");
      const key = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    }
    return Object.entries(grouped).map(([title, data]) => ({ title, data }));
  }, [filtered]);

  const unreadCount = reports.filter((r: any) => r.status === "sent").length;

  if (isLoading) return <LoadingOverlay visible />;

  const filterChipsHeader = (
    <View style={styles.chips}>
      {FILTER_CHIPS.map((f) => (
        <Chip
          key={f.key}
          mode="outlined"
          selected={filter === f.key}
          onPress={() => setFilter(f.key)}
          style={[
            styles.chip,
            filter === f.key && { backgroundColor: theme.colors.primary },
          ]}
          showSelectedCheck={false}
          textStyle={[filter === f.key && { color: theme.colors.onPrimary }]}
        >
          {f.label}
          {f.key === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
        </Chip>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StickyParallaxChildHeader />

      <AnimatedSectionList
        sections={sections}
        keyExtractor={(item: any) => String(item.id)}
        contentContainerStyle={{
          paddingTop: collapsedHeight,
          paddingHorizontal: 16,
          paddingBottom: 32,
          flexGrow: 1,
        }}
        ListHeaderComponent={filterChipsHeader}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            progressViewOffset={collapsedHeight}
          />
        }
        renderSectionHeader={({ section }: any) => (
          <Text variant="titleSmall" style={styles.sectionHeader}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }: any) => (
          <ParentReportCard
            report={item}
            onPress={() =>
              navigation.navigate("ParentReportDetail", { reportId: item.id })
            }
          />
        )}
        ListEmptyComponent={
          <View style={{ paddingTop: 24 }}>
            <EmptyState
              lottie={ReportPlaceholderJson}
              title="Chưa có báo cáo nào"
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  chip: { borderRadius: 20 },
  sectionHeader: {
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    color: "#212121",
  },
});
