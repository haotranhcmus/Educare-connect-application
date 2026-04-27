import React from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { useMyStudents } from "../../hooks/useStudents";
import { useTodaySessions } from "../../hooks/useSessions";
import { usePendingReportCount } from "../../hooks/useReports";
import { AvatarLabel } from "../../components/common/AvatarLabel";
import { SectionHeader } from "../../components/common/SectionHeader";
import { SessionListCard } from "../../components/student/SessionListCard";
import { StatusBadge } from "../../components/common/StatusBadge";

export function HomeScreen({ navigation }: any) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* ── Top Header Banner ───────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.primary,
            paddingTop: insets.top + 12,
          },
        ]}
      >
        {/* Row: avatar + name/center + date */}
        <View style={styles.headerRow}>
          <View
            style={[
              styles.avatarBox,
              { backgroundColor: "rgba(255,255,255,0.20)" },
            ]}
          >
            <MaterialCommunityIcons name="account" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.greetLabel}>Xin chào,</Text>
            <Text style={styles.greetName} numberOfLines={1}>
              {userName}
            </Text>
            {centerName ? (
              <Text style={styles.greetCenter} numberOfLines={1}>
                {centerName}
              </Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.dateLabel}>{dateStr}</Text>

        {/* Quick-stat chips */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <MaterialCommunityIcons
              name="calendar-today"
              size={14}
              color="#fff"
            />
            <Text style={styles.statText}>
              {todaySessions.length} buổi hôm nay
            </Text>
          </View>
          {pendingCount > 0 && (
            <TouchableOpacity
              style={[
                styles.statChip,
                { backgroundColor: "rgba(255,255,255,0.30)" },
              ]}
              onPress={() =>
                navigation.navigate("ReportTab", { screen: "ReportList" })
              }
            >
              <MaterialCommunityIcons
                name="file-document-alert"
                size={14}
                color="#fff"
              />
              <Text style={styles.statText}>{pendingCount} báo cáo chờ</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Scrollable Content ─────────────────────────────── */}
      <ScrollView style={{ flex: 1 }}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Banner header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  greetLabel: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
  greetName: { color: "#fff", fontSize: 17, fontWeight: "700", lineHeight: 22 },
  greetCenter: { color: "rgba(255,255,255,0.80)", fontSize: 12, marginTop: 1 },
  dateLabel: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 12,
    marginTop: 10,
    marginBottom: 12,
  },
  statsRow: { flexDirection: "row", gap: 8 },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  statText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  // Content
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
