import React from "react";
import { SectionList, View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useStudentSessions } from "../../../../hooks/useSessions";
import { SessionListCard } from "../../../../components/session/SessionListCard";
import { EmptyState } from "../../../../components/common/EmptyState";
import SessionPlaceholder from "../../../../../assets/placeholder/session-placeholder.svg";
import type { SessionListItem } from "../../../../types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { StudentStackParamList } from "../../../../navigation/types";
import { SafeAreaView } from "react-native-safe-area-context";

type StudentDetailNav = NativeStackNavigationProp<
  StudentStackParamList,
  "StudentDetail"
>;

interface Props {
  studentId: number;
  navigation: StudentDetailNav;
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

  const renderItem = ({ item }: { item: SessionListItem }) => (
    <SessionListCard
      session={item}
      onPress={() => navigation.navigate("SessionDetail", { sessionId: item.id })}
    />
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["bottom"]}
    >
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
            <EmptyState image={SessionPlaceholder} title="Chưa có buổi học" />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 16 },
  sectionTitle: { paddingVertical: 8, fontWeight: "600" },
});
