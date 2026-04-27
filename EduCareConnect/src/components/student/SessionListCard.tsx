import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { StatusBadge } from "../common/StatusBadge";
import { formatFloatTime } from "../../utils/formatters";
import { SESSION_PURPOSE_LABELS, LOCATION_LABELS } from "../../utils/labels";
import type { SessionListItem } from "../../types";

interface SessionListCardProps {
  session: SessionListItem;
  onPress: (sessionId: number) => void;
  compact?: boolean;
}

export function SessionListCard({
  session,
  onPress,
  compact = false,
}: SessionListCardProps) {
  const theme = useTheme();
  const studentName = Array.isArray(session.student_id)
    ? session.student_id[1]
    : "";

  return (
    <TouchableOpacity onPress={() => onPress(session.id)} activeOpacity={0.7}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {formatFloatTime(session.start_time)} –{" "}
          {formatFloatTime(session.end_time)}
        </Text>
        <Text
          variant="titleSmall"
          style={{ color: theme.colors.onSurface, fontWeight: "600" }}
        >
          {studentName}
        </Text>
        {!compact && (
          <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
            {SESSION_PURPOSE_LABELS[session.session_purpose] ||
              session.session_purpose}
            {" · "}
            {LOCATION_LABELS[session.location] || session.location}
          </Text>
        )}
        <StatusBadge status={session.status} size="small" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
  },
});
