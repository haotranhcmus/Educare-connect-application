import React from "react";
import { SectionList, View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import { useStudentSessions } from "../../../../hooks/useSessions";
import { StatusBadge } from "../../../../components/common/StatusBadge";
import { EmptyState } from "../../../../components/common/EmptyState";
import { formatFloatTime, formatDate } from "../../../../utils/formatters";
import {
  SESSION_PURPOSE_LABELS,
  LOCATION_LABELS,
} from "../../../../utils/labels";
import type { SessionListItem } from "../../../../types";

interface Props {
  studentId: number;
  navigation: any;
}

function groupByMonth(sessions: SessionListItem[]) {
  const groups: Record<string, SessionListItem[]> = {};
  sessions.forEach((s) => {
    const date = new Date(s.session_date);
    const key = `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

export function StudentSessionTab({ studentId, navigation }: Props) {
  const theme = useTheme();
  const {
    data: sessions = [],
    isLoading,
    refetch,
    isRefetching,
  } = useStudentSessions(studentId);
  const sections = groupByMonth(sessions);

  const navigateToSessionTab = (
    screen: "SessionDetail" | "SessionCreate",
    params: Record<string, number>,
  ) => {
    const parent = navigation.getParent?.();
    const canNavigateViaParentTab = parent
      ?.getState?.()
      ?.routeNames?.includes("SessionTab");

    if (canNavigateViaParentTab) {
      parent.navigate("SessionTab", { screen, params });
      return;
    }

    navigation.navigate("TeacherTabs", {
      screen: "SessionTab",
      params: { screen, params },
    });
  };

  const renderItem = ({ item }: { item: SessionListItem }) => (
    <TouchableOpacity
      onPress={() =>
        navigateToSessionTab("SessionDetail", { sessionId: item.id })
      }
      activeOpacity={0.7}
    >
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.cardRow}>
          <Text variant="labelMedium">{item.name}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
            {formatDate(item.session_date)}
          </Text>
        </View>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {SESSION_PURPOSE_LABELS[item.session_purpose] || item.session_purpose}{" "}
          · {LOCATION_LABELS[item.location] || item.location}
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {formatFloatTime(item.start_time)} – {formatFloatTime(item.end_time)}{" "}
          ({item.end_time - item.start_time} phút)
        </Text>
        <View style={styles.cardFooter}>
          {(item.avg_accuracy || 0) > 0 && (
            <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
              Avg: {Math.round(item.avg_accuracy || 0)}%
            </Text>
          )}
          <StatusBadge status={item.status} size="small" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          icon="plus"
          onPress={() => navigateToSessionTab("SessionCreate", { studentId })}
        >
          Tạo buổi học mới
        </Button>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text
            variant="titleSmall"
            style={[
              styles.sectionTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {title}
          </Text>
        )}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState icon="calendar-blank" title="Chưa có buổi học" />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: { padding: 16 },
  list: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 16 },
  sectionTitle: { paddingVertical: 8, fontWeight: "600" },
  card: { padding: 12, borderRadius: 12, marginBottom: 8, elevation: 1 },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
});
