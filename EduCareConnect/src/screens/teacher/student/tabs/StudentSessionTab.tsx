import React from "react";
import { SectionList, View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useStudentSessions } from "../../../../hooks/useSessions";
import { SessionListCard } from "../../../../components/session/SessionListCard";
import { EmptyState } from "../../../../components/common/EmptyState";
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
    <SessionListCard
      session={item}
      onPress={() =>
        navigateToSessionTab("SessionDetail", { sessionId: item.id })
      }
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.buttonContainer}>
        {/* <Button
          mode="outlined"
          icon="plus"
          onPress={() => navigateToSessionTab("SessionCreate", { studentId })}
        >
          Tạo buổi học mới
        </Button> */}
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
});
