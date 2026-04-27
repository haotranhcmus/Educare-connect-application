import React from "react";
import { ScrollView, View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Button, Card, useTheme } from "react-native-paper";
import { useAuthStore } from "../../store/authStore";
import { useMyStudents } from "../../hooks/useStudents";
import { useTodaySessions } from "../../hooks/useSessions";
import { usePendingReportCount } from "../../hooks/useReports";
import { AvatarLabel } from "../../components/common/AvatarLabel";
import { SectionHeader } from "../../components/common/SectionHeader";
import { SessionListCard } from "../../components/student/SessionListCard";
import { EmptyState } from "../../components/common/EmptyState";
import { StatusBadge } from "../../components/common/StatusBadge";

export function HomeScreen({ navigation }: any) {
  const theme = useTheme();
  const { userName, centerName } = useAuthStore();
  const { data: todaySessions = [] } = useTodaySessions();
  const { data: pendingCount = 0 } = usePendingReportCount();
  const { data: students = [] } = useMyStudents();

  const today = new Date();
  const dateStr = today.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const handleSessionPress = (sessionId: number) => {
    navigation.navigate("SessionTab", {
      screen: "SessionDetail",
      params: { sessionId },
    });
  };

  const handleStudentPress = (studentId: number) => {
    navigation.getParent()?.navigate("StudentDetail", { studentId });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Greeting Header */}
      <View
        style={[styles.greeting, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.greetingRow}>
          <AvatarLabel name={userName || "User"} size={44} />
          <View style={styles.greetingText}>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Xin chào,
            </Text>
            <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
              {userName}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {centerName}
            </Text>
          </View>
        </View>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
        >
          {dateStr}
        </Text>
      </View>

      {/* Today Sessions */}
      <SectionHeader
        icon="calendar-today"
        title={`Hôm nay — ${todaySessions.length} buổi học`}
      />
      <View style={styles.section}>
        {todaySessions.length > 0 ? (
          todaySessions.map((s) => (
            <SessionListCard
              key={s.id}
              session={s}
              onPress={handleSessionPress}
            />
          ))
        ) : (
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.outline, paddingHorizontal: 16 }}
          >
            Không có buổi học hôm nay
          </Text>
        )}
      </View>

      {/* Pending Reports */}
      <SectionHeader icon="file-document-alert" title="Báo cáo chờ gửi" />
      <View style={styles.section}>
        <Card
          style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}
        >
          <Card.Content>
            <Text variant="bodyMedium">
              <Text style={{ fontWeight: "bold", color: theme.colors.primary }}>
                {pendingCount}
              </Text>{" "}
              báo cáo chưa gửi cho phụ huynh
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button
              onPress={() =>
                navigation.navigate("ReportTab", { screen: "ReportList" })
              }
            >
              Xem tất cả
            </Button>
          </Card.Actions>
        </Card>
      </View>

      {/* My Students */}
      <SectionHeader
        icon="account-group"
        title={`Học sinh của tôi — ${students.length} học sinh`}
        action={{
          label: "Xem tất cả",
          onPress: () =>
            navigation.navigate("StudentTab", { screen: "StudentList" }),
        }}
      />
      <View style={styles.section}>
        {students.slice(0, 3).map((s) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => handleStudentPress(s.id)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.studentRow,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <AvatarLabel name={s.name} size={36} />
              <Text variant="bodyMedium" style={{ flex: 1, marginLeft: 12 }}>
                {s.name}
              </Text>
              <StatusBadge status={s.status} size="small" />
            </View>
          </TouchableOpacity>
        ))}
        {students.length > 3 && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("StudentTab", { screen: "StudentList" })
            }
          >
            <Text
              variant="labelMedium"
              style={{
                color: theme.colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              + {students.length - 3} học sinh khác →
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  greeting: { padding: 16, marginBottom: 8 },
  greetingRow: { flexDirection: "row", alignItems: "center" },
  greetingText: { marginLeft: 12 },
  section: { paddingHorizontal: 16, marginBottom: 16 },

  infoCard: { borderRadius: 12 },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
});
