import React from "react";
import { FlatList, View, StyleSheet } from "react-native";
import { Text, Card, useTheme } from "react-native-paper";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { EmptyState } from "../../../components/common/EmptyState";
import { useMyStudent, useIepPlanHistory } from "../../../hooks/useParent";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ParentIepStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<ParentIepStackParamList, "ParentIepPlan">;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "🟢 Đang hoạt động", color: "#2E7D32" },
  closed: { label: "⚫ Đã đóng", color: "#757575" },
  supervisor_approved: { label: "🔵 Đã phê duyệt", color: "#1976D2" },
  ready_review: { label: "🟡 Chờ duyệt", color: "#F9A825" },
  draft: { label: "⬜ Nháp", color: "#BDBDBD" },
};

export function IepHistoryScreen({ navigation }: Props) {
  const theme = useTheme();
  const { data: student } = useMyStudent();
  const { data: plans = [], isLoading } = useIepPlanHistory(student?.id);

  if (isLoading) return <LoadingOverlay visible />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {student && (
        <Text variant="bodyMedium" style={{ padding: 16, color: "#757575" }}>
          {student.name} · {student.student_code}
        </Text>
      )}

      <FlatList
        data={plans}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;
          const supervisor = Array.isArray(item.supervisor_id)
            ? item.supervisor_id[1]
            : "—";

          return (
            <Card
              style={styles.card}
              mode="outlined"
              onPress={() =>
                navigation.navigate("ParentIepPlanDetail", {
                  planId: item.id,
                  plan: item,
                })
              }
            >
              <Card.Content>
                <Text variant="titleMedium">{item.iep_period}</Text>
                <Text variant="bodySmall" style={{ color: "#757575" }}>
                  {item.start_date} → {item.end_date}
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: cfg.color, marginTop: 4 }}
                >
                  {cfg.label}
                </Text>
                <Text variant="bodySmall" style={{ color: "#757575" }}>
                  Phiên bản {item.version_number || 1} · Supervisor:{" "}
                  {supervisor}
                </Text>
              </Card.Content>
              <Card.Actions>
                <Text variant="bodySmall">Xem &gt;</Text>
              </Card.Actions>
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-text-clock-outline"
            title="Chưa có kỳ IEP nào"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12, borderRadius: 12 },
});
