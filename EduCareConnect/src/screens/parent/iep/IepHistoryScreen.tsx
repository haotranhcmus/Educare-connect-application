import React from "react";
import { FlatList, View, TouchableOpacity, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { EmptyState } from "../../../components/common/EmptyState";
import { useIepPlanHistory } from "../../../hooks/useParent";
import { useParentStore } from "../../../store/parentStore";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ParentTimetableStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<
  ParentTimetableStackParamList,
  "ChildIepHistory"
>;

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    bg: string;
    color: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
  }
> = {
  active: {
    label: "Đang hoạt động",
    bg: "#E8F5E9",
    color: "#2E7D32",
    icon: "check-circle",
  },
  closed: {
    label: "Đã đóng",
    bg: "#F5F5F5",
    color: "#757575",
    icon: "close-circle",
  },
  supervisor_approved: {
    label: "Đã phê duyệt",
    bg: "#E3F2FD",
    color: "#1976D2",
    icon: "shield-check",
  },
  ready_review: {
    label: "Chờ duyệt",
    bg: "#FFFDE7",
    color: "#F9A825",
    icon: "clock-outline",
  },
  draft: {
    label: "Nháp",
    bg: "#EEEEEE",
    color: "#9E9E9E",
    icon: "pencil-outline",
  },
};

export function IepHistoryScreen({ navigation }: Props) {
  const theme = useTheme();
  const { selectedStudentId, selectedStudent } = useParentStore();
  const studentName = selectedStudent?.name;
  const { data: plans = [], isLoading } = useIepPlanHistory(
    selectedStudentId ?? undefined,
  );

  if (isLoading) return <LoadingOverlay visible />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {studentName && (
        <View
          style={[
            styles.subheader,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <MaterialCommunityIcons
            name="account-child-outline"
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginLeft: 6 }}
          >
            {studentName}
          </Text>
        </View>
      )}

      <FlatList
        data={plans}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-text-clock-outline"
            title="Chưa có kỳ IEP nào"
          />
        }
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft;
          const supervisor = Array.isArray(item.supervisor_id)
            ? item.supervisor_id[1]
            : "—";

          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.colors.surface }]}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate("ChildIepPlanDetail", {
                  planId: item.id,
                  plan: item,
                })
              }
            >
              <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                  <MaterialCommunityIcons
                    name={cfg.icon}
                    size={13}
                    color={cfg.color}
                  />
                  <Text
                    variant="labelSmall"
                    style={{
                      color: cfg.color,
                      marginLeft: 4,
                      fontWeight: "600",
                    }}
                  >
                    {cfg.label}
                  </Text>
                </View>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.outline }}
                >
                  v{item.version_number || 1}
                </Text>
              </View>

              <Text
                variant="titleSmall"
                style={{ fontWeight: "700", marginBottom: 4 }}
              >
                {item.iep_period}
              </Text>

              <View style={styles.metaRow}>
                <MaterialCommunityIcons
                  name="calendar-range"
                  size={13}
                  color={theme.colors.outline}
                />
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.outline, marginLeft: 4 }}
                >
                  {item.start_date} → {item.end_date}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons
                  name="account-supervisor-outline"
                  size={13}
                  color={theme.colors.outline}
                />
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.outline, marginLeft: 4 }}
                >
                  {supervisor}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.primary }}
                >
                  Xem chi tiết
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={16}
                  color={theme.colors.primary}
                />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  subheader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 2,
  },
});
