import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatDate } from "@utils/formatters";
import type { IepPlan } from "@t";

// ── Status & accent palette ──────────────────────────────────
const STATUS_CFG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  active: { label: "Đang hoạt động", color: "#1565C0", bg: "#EEF4FF" },
  completed: { label: "Hoàn thành", color: "#2E7D32", bg: "#F0FDF4" },
  supervisor_approved: {
    label: "Đã phê duyệt",
    color: "#0277BD",
    bg: "#E1F5FE",
  },
  ready_review: { label: "Chờ duyệt", color: "#E65100", bg: "#FFF7ED" },
  draft: { label: "Nháp", color: "#757575", bg: "#F5F5F5" },
  closed: { label: "Đã đóng", color: "#455A64", bg: "#ECEFF1" },
};

const ACCENT: Record<string, string> = {
  active: "#1565C0",
  completed: "#2E7D32",
  supervisor_approved: "#0277BD",
  ready_review: "#E65100",
  draft: "#757575",
  closed: "#455A64",
};

interface Props {
  item: IepPlan;
  onPress: () => void;
}

export function IepPlanCard({ item, onPress }: Props) {
  const theme = useTheme();

  const status = STATUS_CFG[item.status] ?? STATUS_CFG.active;
  const accent = ACCENT[item.status] ?? ACCENT.active;
  const supervisor = Array.isArray(item.supervisor_id)
    ? item.supervisor_id[1]
    : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={styles.wrapper}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        {/* Left accent strip */}
        <View style={[styles.strip, { backgroundColor: accent }]} />

        {/* Card content */}
        <View style={styles.content}>
          {/* ── Header ── */}
          <View style={styles.headerRow}>
            <View style={styles.titleBlock}>
              <Text
                style={[styles.periodTitle, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {item.iep_period}
              </Text>
              <View
                style={[styles.versionTag, { backgroundColor: accent + "18" }]}
              >
                <Text style={[styles.versionText, { color: accent }]}>
                  v{item.version_number}
                </Text>
              </View>
            </View>

            {/* Status badge */}
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <View
                style={[styles.statusDot, { backgroundColor: status.color }]}
              />
              <Text style={[styles.statusLabel, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>

          {/* ── Dates — two columns ── */}
          <View style={styles.datesRow}>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>BẮT ĐẦU</Text>
              <View style={styles.dateValueRow}>
                <MaterialCommunityIcons
                  name="calendar-start"
                  size={13}
                  color={accent}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.dateValue,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {formatDate(item.start_date)}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.dateSeparator,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />

            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>KẾT THÚC</Text>
              <View style={styles.dateValueRow}>
                <MaterialCommunityIcons
                  name="calendar-end"
                  size={13}
                  color={accent}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.dateValue,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {formatDate(item.end_date)}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Supervisor ── */}
          {supervisor && (
            <View style={styles.supervisorRow}>
              <MaterialCommunityIcons
                name="account-tie-outline"
                size={13}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.supervisorText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                numberOfLines={1}
              >
                {supervisor}
              </Text>
            </View>
          )}

          {/* ── Footer divider ── */}
          <View
            style={[
              styles.footerDivider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <View style={styles.goalRow}>
              <View
                style={[
                  styles.goalIconWrap,
                  { backgroundColor: accent + "18" },
                ]}
              >
                <MaterialCommunityIcons
                  name="target"
                  size={14}
                  color={accent}
                />
              </View>
              <Text style={[styles.goalText, { color: theme.colors.onSurface }]}>
                <Text style={{ fontWeight: "700", color: accent }}>
                  {item.goal_count ?? 0}
                </Text>
                {"  mục tiêu dài hạn"}
              </Text>
            </View>

            <View
              style={[styles.arrowBtn, { backgroundColor: accent + "14" }]}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={accent}
              />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 14,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
    }),
  },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
  },

  // Left accent strip
  strip: {
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },

  // Card content
  content: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 0,
    paddingHorizontal: 14,
  },

  // ── Header ───────────────────────────────────────────
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 14,
  },
  titleBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flex: 1,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  versionTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  versionText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  // Status badge
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    flexShrink: 0,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ── Dates ────────────────────────────────────────────
  datesRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 0,
    marginBottom: 12,
  },
  dateCol: {
    flex: 1,
    gap: 4,
  },
  dateLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#9E9E9E",
    letterSpacing: 0.8,
  },
  dateValueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  dateSeparator: {
    width: 1,
    marginHorizontal: 14,
    marginVertical: 2,
  },

  // ── Supervisor ───────────────────────────────────────
  supervisorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 12,
  },
  supervisorText: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },

  // ── Footer ───────────────────────────────────────────
  footerDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: -14,
    marginBottom: 0,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  goalIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  goalText: {
    fontSize: 13,
    fontWeight: "500",
  },
  arrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
