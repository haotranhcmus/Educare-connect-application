import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatDate } from "@utils/formatters";
import type { ReportListItem } from "@t";

interface ParentReportCardProps {
  report: ReportListItem & { teacher_id?: [number, string] | false };
  onPress: () => void;
}

const ACCENT: Record<string, string> = {
  sent: "#1976D2",
  read: "#2E7D32",
  draft: "#9E9E9E",
  ready: "#1976D2",
};

function ParentReportCardImpl({ report, onPress }: ParentReportCardProps) {
  const theme = useTheme();
  const isUnread = report.status === "sent";
  const accentColor = ACCENT[report.status] ?? "#9E9E9E";
  const teacherName = Array.isArray(report.teacher_id)
    ? report.teacher_id[1]
    : "";
  const preview = report.activity_summary
    ? report.activity_summary.substring(0, 72) +
      (report.activity_summary.length > 72 ? "…" : "")
    : "";

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.72}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isUnread ? "#EFF6FF" : theme.colors.surface,
          },
        ]}
      >
        {/* Left accent strip */}
        <View style={[styles.accent, { backgroundColor: accentColor }]} />

        {/* Body */}
        <View style={styles.body}>
          {/* Top row: date + status */}
          <View style={styles.topRow}>
            <View style={styles.dateRow}>
              <MaterialCommunityIcons
                name="calendar-outline"
                size={13}
                color={theme.colors.outline}
              />
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.outline, marginLeft: 4 }}
              >
                {formatDate(report.report_date)}
              </Text>
            </View>

            {/* Unread / read badge */}
            {isUnread ? (
              <View style={styles.unreadBadge}>
                <View style={styles.unreadDot} />
                <Text style={styles.unreadText}>Mới</Text>
              </View>
            ) : (
              <View style={styles.readBadge}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={12}
                  color="#2E7D32"
                />
                <Text style={styles.readText}>Đã đọc</Text>
              </View>
            )}
          </View>

          {/* Report name */}
          <Text
            variant="bodyMedium"
            style={[
              styles.reportName,
              { color: theme.colors.onSurface },
            ]}
            numberOfLines={1}
          >
            {report.name}
          </Text>

          {/* Preview */}
          {preview ? (
            <Text
              variant="bodySmall"
              numberOfLines={2}
              style={[styles.preview, { color: theme.colors.onSurfaceVariant }]}
            >
              {preview}
            </Text>
          ) : null}

          {/* Footer: teacher */}
          {teacherName ? (
            <View style={styles.footer}>
              <MaterialCommunityIcons
                name="account-tie-outline"
                size={13}
                color={theme.colors.outline}
              />
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.outline, marginLeft: 4 }}
              >
                {teacherName}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Chevron */}
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={theme.colors.outlineVariant}
          style={styles.chevron}
        />
      </View>
    </TouchableOpacity>
  );
}

export const ParentReportCard = React.memo(ParentReportCardImpl);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    // shadowColor: "#000",
    // shadowOpacity: 0.06,
    // shadowRadius: 4,
    // shadowOffset: { width: 0, height: 2 },
    overflow: "hidden",
  },
  accent: { width: 4 },
  body: { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  dateRow: { flexDirection: "row", alignItems: "center" },
  unreadBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1976D2",
  },
  unreadText: { fontSize: 11, fontWeight: "700", color: "#1565C0" },
  readBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  readText: { fontSize: 11, color: "#2E7D32", fontWeight: "600" },
  reportName: { fontWeight: "700", marginBottom: 4, fontSize: 14 },
  preview: { lineHeight: 18, marginBottom: 6 },
  footer: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  chevron: { alignSelf: "center", paddingRight: 8 },
});
