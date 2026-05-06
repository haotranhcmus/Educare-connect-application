import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { AvatarLabel } from "../common/AvatarLabel";
import { StatusBadge } from "../common/StatusBadge";
import { formatDate, formatFloatTime } from "../../utils/formatters";
import type { SessionListItem } from "../../types";

const PURPOSE_LABEL: Record<string, string> = {
  intervention: "Can thiệp",
  maintenance_probe: "Đánh giá duy trì",
  generalization_probe: "Đánh giá tổng quát hóa",
  parent_training: "Hướng dẫn phụ huynh",
};

const TYPE_LABEL: Record<string, string> = {
  individual: "1:1",
  small_group: "Nhóm nhỏ",
  consultation: "Tư vấn",
};

const LOCATION_LABEL: Record<string, string> = {
  center: "Tại TC",
  home: "Tại nhà",
  school: "Tại trường",
  online: "Online",
};

interface SessionListCardProps {
  session: SessionListItem;
  onPress: () => void;
}

export function SessionListCard({ session, onPress }: SessionListCardProps) {
  const theme = useTheme();
  const studentName = Array.isArray(session.student_id)
    ? session.student_id[1]
    : "";

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.topRow}>
          <AvatarLabel
            uri={session.student_avatar_url}
            name={studentName}
            size={36}
          />
          <View style={styles.topInfo}>
            <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
              {studentName}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
              {session.name}
            </Text>
          </View>
        </View>

        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
        >
          {formatDate(session.session_date)} ·{" "}
          {formatFloatTime(session.start_time)}–
          {formatFloatTime(session.end_time)}
        </Text>

        <Text
          variant="labelSmall"
          style={{ color: theme.colors.outline, marginTop: 2 }}
        >
          {PURPOSE_LABEL[session.session_purpose] || session.session_purpose} ·{" "}
          {TYPE_LABEL[session.session_type] || session.session_type} ·{" "}
          {LOCATION_LABEL[session.location] || session.location}
        </Text>

        <View style={styles.footer}>
          {session.status === "done" && (
            <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
              Avg: {Math.round(session.avg_accuracy || 0)}% ·{" "}
              {session.result_count || 0} MT
            </Text>
          )}
          <StatusBadge status={session.status} size="small" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 12, marginBottom: 8, elevation: 1 },
  topRow: { flexDirection: "row", alignItems: "center" },
  topInfo: { marginLeft: 10, flex: 1 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
});
