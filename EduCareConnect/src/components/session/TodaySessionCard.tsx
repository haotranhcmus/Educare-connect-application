import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatFloatTime } from "@utils/formatters";
import {
  SESSION_PURPOSE_LABELS,
  SESSION_TYPE_SHORT_LABELS,
  LOCATION_LABELS,
} from "@utils/labels";
import type { SessionListItem } from "@t";

interface Props {
  session: SessionListItem;
  onPress: () => void;
  hasReport?: boolean;
}

type GradientPair = [string, string];

const STATUS_CFG: Record<
  string,
  { label: string; gradient: GradientPair; isLive?: boolean }
> = {
  // Matching labels from statusColors.ts exactly
  not_started: { label: "Chưa bắt đầu", gradient: ["#1A237E", "#283593"] },
  in_progress: {
    label: "Đang diễn ra",
    gradient: ["#004D40", "#00695C"],
    isLive: true,
  },
  scheduled: { label: "Đã lên lịch", gradient: ["#0D47A1", "#1565C0"] },
  completed: { label: "Chờ kết quả", gradient: ["#E65100", "#EF6C00"] },
  done: { label: "Đã dạy", gradient: ["#1B5E20", "#2E7D32"] },
  cancelled: { label: "Đã hủy", gradient: ["#37474F", "#455A64"] },
  draft: { label: "Nháp", gradient: ["#4A148C", "#6A1B9A"] },
};

const DEFAULT_CFG = STATUS_CFG.scheduled;

// Only sessions that actually took place can have a report.
// scheduled / in_progress / not_started / draft / cancelled → no report badge.
const REPORT_ELIGIBLE = new Set(["done", "completed"]);

export function TodaySessionCard({ session, onPress, hasReport }: Props) {
  const studentName =
    session.student_name ??
    (Array.isArray(session.student_id) ? session.student_id[1] : "");
  const cfg = STATUS_CFG[session.status] ?? DEFAULT_CFG;
  const showReport =
    REPORT_ELIGIBLE.has(session.status) && hasReport !== undefined;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.87}>
      <LinearGradient
        colors={cfg.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* ── Top row ── */}
        <View style={styles.topRow}>
          <View style={styles.statusBadge}>
            {cfg.isLive && <View style={styles.liveDot} />}
            <Text style={styles.statusLabel}>{cfg.label}</Text>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {SESSION_TYPE_SHORT_LABELS[session.session_type] ||
                session.session_type}
            </Text>
          </View>
        </View>

        {/* ── Time ── */}
        <Text style={styles.timeText}>
          {formatFloatTime(session.start_time)} –{" "}
          {formatFloatTime(session.end_time)}
        </Text>

        {/* ── Student ── */}
        <Text style={styles.studentName} numberOfLines={1}>
          {studentName}
        </Text>

        {/* ── Bottom row ── */}
        <View style={styles.bottomRow}>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={12}
              color="rgba(255,255,255,0.7)"
            />
            <Text style={styles.metaText}>
              {LOCATION_LABELS[session.location] || session.location}
            </Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText} numberOfLines={1}>
              {SESSION_PURPOSE_LABELS[session.session_purpose] ||
                session.session_purpose}
            </Text>
          </View>
          {showReport && (
            <View style={styles.reportTag}>
              <MaterialCommunityIcons
                name={hasReport ? "file-check-outline" : "file-clock-outline"}
                size={12}
                color={
                  hasReport
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(255,255,255,0.45)"
                }
              />
              <Text
                style={[styles.reportText, { opacity: hasReport ? 0.9 : 0.45 }]}
              >
                {hasReport ? "Đã báo cáo" : "Chưa báo cáo"}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A5D6A7",
  },
  statusLabel: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 11,
    fontWeight: "600",
  },
  typeBadge: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  typeBadgeText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "500",
  },
  timeText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  studentName: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 15,
    fontWeight: "600",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    flexWrap: "nowrap",
    overflow: "hidden",
  },
  metaText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
  },
  metaDot: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
  },
  reportTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 8,
  },
  reportText: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 11,
    fontWeight: "500",
  },
});
