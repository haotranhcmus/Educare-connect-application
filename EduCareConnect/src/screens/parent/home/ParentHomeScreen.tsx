import React from "react";
import { ScrollView, View, StyleSheet, RefreshControl } from "react-native";
import {
  Avatar,
  Text,
  Card,
  Button,
  ProgressBar,
  useTheme,
} from "react-native-paper";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import {
  useMyStudent,
  useUnreadReportCount,
  useActiveIepPlan,
  useLatestSession,
} from "../../../hooks/useParent";
import { useAuthStore } from "../../../store/authStore";
import { formatFloatTime } from "../../../utils/formatters";
import type { CompositeScreenProps } from "@react-navigation/native";

export function ParentHomeScreen({ navigation }: any) {
  const theme = useTheme();
  const { data: student, isLoading: loadingStudent, refetch } = useMyStudent();
  const { data: unreadCount = 0 } = useUnreadReportCount(student?.id);
  const { data: activePlan } = useActiveIepPlan(student?.id);
  const { data: latestSession } = useLatestSession(student?.id);

  if (loadingStudent) return <LoadingOverlay visible />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
    >
      {/* ── Welcome Header ─────────────────────────────── */}
      <View style={styles.welcomeRow}>
        <Avatar.Icon size={48} icon="account" />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text variant="titleMedium">Xin chào,</Text>
          <Text variant="bodyMedium" style={{ color: "#757575" }}>
            Phụ huynh của: {student?.name || "—"}
          </Text>
        </View>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={{ color: "#fff", fontSize: 12 }}>
              🔔 {unreadCount}
            </Text>
          </View>
        )}
      </View>

      {/* ── Unread Reports Card ────────────────────────── */}
      {unreadCount > 0 && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleSmall">📋 Báo cáo chưa đọc</Text>
            <Text variant="headlineMedium" style={{ marginVertical: 8 }}>
              {unreadCount}
            </Text>
            <Text variant="bodySmall">
              báo cáo mới từ giáo viên đang chờ bạn
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => navigation.navigate("ReportTab")}>
              Xem tất cả &gt;
            </Button>
          </Card.Actions>
        </Card>
      )}

      {/* ── Active IEP Progress Card ──────────────────── */}
      {activePlan && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleSmall">📈 Tiến độ IEP hiện tại</Text>
            <Text
              variant="bodySmall"
              style={{ color: "#757575", marginTop: 4 }}
            >
              Kỳ: {activePlan.iep_period}
            </Text>
            <Text variant="bodySmall" style={{ color: "#757575" }}>
              {activePlan.start_date} → {activePlan.end_date}
            </Text>

            {activePlan.goals?.map((goal: any) => (
              <View key={goal.id} style={{ marginTop: 12 }}>
                <Text variant="bodyMedium">{goal.name}</Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 4,
                  }}
                >
                  <ProgressBar
                    progress={(goal.progress_pct || 0) / 100}
                    color={theme.colors.primary}
                    style={{ flex: 1, height: 8, borderRadius: 4 }}
                  />
                  <Text
                    variant="bodySmall"
                    style={{ marginLeft: 8, width: 40 }}
                  >
                    {Math.round(goal.progress_pct || 0)}%
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
          <Card.Actions>
            <Button
              onPress={() =>
                navigation.navigate("ChildTab", {
                  screen: "IepPlanDetail",
                  params: { planId: activePlan.id },
                })
              }
            >
              Xem chi tiết &gt;
            </Button>
          </Card.Actions>
        </Card>
      )}

      {/* ── Latest Session Card ────────────────────────── */}
      {latestSession && (
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleSmall">📅 Buổi học gần nhất</Text>
            <Text variant="bodyMedium" style={{ marginTop: 8 }}>
              {formatSessionDate(latestSession.session_date)}
            </Text>
            <Text variant="bodySmall" style={{ color: "#757575" }}>
              {formatFloatTime(latestSession.start_time)} –{" "}
              {formatFloatTime(latestSession.end_time)}
              {latestSession.location
                ? `  ·  ${LOCATION_LABELS[latestSession.location] || latestSession.location}`
                : ""}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: "#2E7D32", marginTop: 4 }}
            >
              🟢 Hoàn thành
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const LOCATION_LABELS: Record<string, string> = {
  center: "Tại trung tâm",
  home: "Tại nhà",
  online: "Trực tuyến",
};

function formatSessionDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${days[d.getDay()]}, ${dd}/${mm}/${d.getFullYear()}`;
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  welcomeRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  badge: {
    backgroundColor: "#D32F2F",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  card: { marginBottom: 16, borderRadius: 12 },
});
