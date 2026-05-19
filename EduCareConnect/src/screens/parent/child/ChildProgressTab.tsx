import React from "react";
import {
  FlatList,
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useStudentIepPlans } from "../../../hooks/useIep";
import { EmptyState } from "../../../components/common/EmptyState";
import IepPlaceholder from "../../../../assets/placeholder/iep-placeholder.svg";
import { formatDate } from "../../../utils/formatters";
import type { IepPlan } from "../../../types";

interface NavigateOnly {
  navigate: (route: string, params?: Record<string, unknown>) => void;
}

interface Props {
  studentId: number;
  navigation: NavigateOnly;
  detailRouteName?: string;
  objectiveRouteName?: string;
}

const STATUS_CONFIG: Record<string, { label: string }> = {
  active: { label: "Đang hoạt động" },
  approved: { label: "Đã duyệt" },
  submitted: { label: "Đã nộp" },
  draft: { label: "Nháp" },
  archived: { label: "Lưu trữ" },
  rejected: { label: "Từ chối" },
};

const ACCENT_GRADIENT: Record<string, [string, string]> = {
  active: ["#2E7D32", "#43A047"],
  approved: ["#1565C0", "#1E88E5"],
  submitted: ["#E65100", "#FB8C00"],
  draft: ["#616161", "#9E9E9E"],
  archived: ["#9E9E9E", "#BDBDBD"],
  rejected: ["#B71C1C", "#E53935"],
};

export function ChildProgressTab({
  studentId,
  navigation,
  detailRouteName = "IepPlanDetail",
  objectiveRouteName = "IepObjectiveDetail",
}: Props) {
  const theme = useTheme();
  const {
    data: plans = [],
    isLoading,
    refetch,
    isRefetching,
  } = useStudentIepPlans(studentId);

  const handlePress = (plan: IepPlan) => {
    navigation.navigate(detailRouteName, {
      planId: plan.id,
      studentName: plan.iep_period,
      objectiveRouteName,
    });
  };

  const renderPlan = ({ item }: { item: IepPlan }) => {
    const supervisor = Array.isArray(item.supervisor_id)
      ? item.supervisor_id[1]
      : "";

    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.active;
    const gradient = ACCENT_GRADIENT[item.status] || ACCENT_GRADIENT.active;

    return (
      <TouchableOpacity
        onPress={() => handlePress(item)}
        activeOpacity={0.85}
        style={styles.cardWrapper}
      >
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          {/* ── Gradient header band ── */}
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerBand}
          >
            <View style={styles.headerLeft}>
              <Text style={styles.periodTitle}>{item.iep_period}</Text>
              <View style={styles.versionPill}>
                <Text style={styles.versionText}>v{item.version_number}</Text>
              </View>
            </View>

            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusPillText}>{statusCfg.label}</Text>
            </View>
          </LinearGradient>

          {/* ── Body ── */}
          <View style={styles.body}>
            <View style={styles.metaRow}>
              <View style={styles.metaIconWrap}>
                <MaterialCommunityIcons
                  name="calendar-range"
                  size={15}
                  color={gradient[0]}
                />
              </View>
              <View style={styles.metaContent}>
                <Text style={styles.metaLabel}>Kỳ học</Text>
                <Text
                  style={[styles.metaValue, { color: theme.colors.onSurface }]}
                >
                  {formatDate(item.start_date)}
                  {"  →  "}
                  {formatDate(item.end_date)}
                </Text>
              </View>
            </View>

            {supervisor ? (
              <View style={styles.metaRow}>
                <View style={styles.metaIconWrap}>
                  <MaterialCommunityIcons
                    name="account-tie-outline"
                    size={15}
                    color={gradient[0]}
                  />
                </View>
                <View style={styles.metaContent}>
                  <Text style={styles.metaLabel}>Giám sát viên</Text>
                  <Text
                    style={[
                      styles.metaValue,
                      { color: theme.colors.onSurface },
                    ]}
                    numberOfLines={1}
                  >
                    {supervisor}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* ── Divider ── */}
          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <View style={styles.goalChip}>
              <LinearGradient
                colors={[gradient[0] + "18", gradient[1] + "10"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.goalChipGradient}
              >
                <MaterialCommunityIcons
                  name="target"
                  size={16}
                  color={gradient[0]}
                />
                <Text style={[styles.goalText, { color: gradient[0] }]}>
                  {item.goal_count || 0} mục tiêu dài hạn
                </Text>
              </LinearGradient>
            </View>

            <View
              style={[styles.arrowBtn, { backgroundColor: gradient[0] + "12" }]}
            >
              <MaterialCommunityIcons
                name="arrow-right"
                size={18}
                color={gradient[0]}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={plans}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderPlan}
      onRefresh={refetch}
      refreshing={isRefetching}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState image={IepPlaceholder} title="Chưa có kế hoạch IEP" />
        ) : null
      }
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 1, padding: 16, gap: 14 },

  cardWrapper: {
    borderRadius: 16,
    ...Platform.select({
      ios: {
        // shadowColor: "#000",
        // shadowOffset: { width: 0, height: 4 },
        // shadowOpacity: 0.1,
        // shadowRadius: 12,
      },
      android: { elevation: 5 },
    }),
  },

  card: {
    borderRadius: 16,
    overflow: "hidden",
  },

  headerBand: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  periodTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
  versionPill: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  versionText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },

  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  metaIconWrap: {
    marginTop: 1,
    width: 22,
    alignItems: "center",
  },
  metaContent: {
    flex: 1,
    gap: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9E9E9E",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    marginTop: 12,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  goalChip: {
    borderRadius: 10,
    overflow: "hidden",
    flex: 1,
    marginRight: 8,
  },
  goalChipGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  goalText: {
    fontSize: 13,
    fontWeight: "700",
  },
  arrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
