import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { AvatarLabel } from "../common/AvatarLabel";
import { StatusBadge } from "../common/StatusBadge";
import { formatDate } from "../../utils/formatters";
import type { ReportListItem } from "../../types";

interface ReportListCardProps {
  report: ReportListItem;
  onPress: () => void;
}

export function ReportListCard({ report, onPress }: ReportListCardProps) {
  const theme = useTheme();
  const studentName = Array.isArray(report.student_id)
    ? report.student_id[1]
    : "";
  const preview = report.activity_summary
    ? report.activity_summary.substring(0, 45) +
      (report.activity_summary.length > 45 ? "..." : "")
    : "";

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.topRow}>
          <AvatarLabel
            uri={report.student_avatar_url}
            name={studentName}
            size={36}
          />
          <View style={styles.info}>
            <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
              {studentName}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
              {report.name}
            </Text>
          </View>
        </View>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
        >
          {formatDate(report.report_date)}
        </Text>
        {preview ? (
          <Text
            variant="bodySmall"
            numberOfLines={1}
            style={{ color: theme.colors.outline, marginTop: 2 }}
          >
            {preview}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <StatusBadge status={report.status} size="small" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 12, marginBottom: 8, elevation: 1 },
  topRow: { flexDirection: "row", alignItems: "center" },
  info: { marginLeft: 10, flex: 1 },
  footer: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
});
