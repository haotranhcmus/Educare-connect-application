import React, { useState } from "react";
import { FlatList, View, StyleSheet, RefreshControl } from "react-native";
import { Searchbar, Chip, Text, useTheme } from "react-native-paper";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { EmptyState } from "../../../components/common/EmptyState";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { formatDate } from "../../../utils/formatters";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TeacherIepStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<TeacherIepStackParamList, "IepPlanList">;

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Đang thực hiện" },
  { key: "draft", label: "Nháp" },
  { key: "completed", label: "Hoàn thành" },
];

export function IepPlanListScreen({ navigation }: Props) {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // TODO: useMyIepPlans hook – fetchMyIepPlans with teacher_id domain
  // For now this is a placeholder structure
  const plans: any[] = [];
  const isLoading = false;

  const filtered = plans.filter((p) => {
    const matchSearch =
      !search ||
      p.plan_code?.toLowerCase().includes(search.toLowerCase()) ||
      (Array.isArray(p.student_id) &&
        p.student_id[1]?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Searchbar
        placeholder="Tìm kế hoạch IEP..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      <View style={styles.chips}>
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.key}
            selected={statusFilter === f.key}
            onPress={() => setStatusFilter(f.key)}
            style={{ marginRight: 8 }}
          >
            {f.label}
          </Chip>
        ))}
      </View>

      {isLoading ? (
        <LoadingOverlay visible />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <EmptyState
              icon="clipboard-text-outline"
              title="Không có kế hoạch IEP"
            />
          }
          renderItem={({ item }) => (
            <PlanListItem
              plan={item}
              onPress={() =>
                navigation.navigate("IepPlanDetail", { planId: item.id })
              }
            />
          )}
        />
      )}
    </View>
  );
}

function PlanListItem({ plan, onPress }: { plan: any; onPress: () => void }) {
  const theme = useTheme();
  const studentName = Array.isArray(plan.student_id) ? plan.student_id[1] : "";

  return (
    <View style={[styles.planItem, { backgroundColor: theme.colors.surface }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
          {plan.plan_code}
        </Text>
        <StatusBadge status={plan.status} size="small" />
      </View>
      <Text variant="bodyMedium" style={{ marginTop: 4 }} onPress={onPress}>
        {studentName}
      </Text>
      <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
        {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  search: { margin: 16, marginBottom: 8 },
  chips: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 8 },
  planItem: { padding: 12, borderRadius: 12, marginBottom: 8, elevation: 1 },
});
