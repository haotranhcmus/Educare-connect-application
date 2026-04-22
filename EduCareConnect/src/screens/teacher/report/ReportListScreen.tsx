import React, { useState, useMemo } from "react";
import { View, FlatList, StyleSheet, RefreshControl } from "react-native";
import { Searchbar, Chip, FAB, useTheme } from "react-native-paper";
import { ReportListCard } from "../../../components/report/ReportListCard";
import { EmptyState } from "../../../components/common/EmptyState";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { useMyReports } from "../../../hooks/useReports";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ReportStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<ReportStackParamList, "ReportList">;

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "draft", label: "Nháp" },
  { key: "sent", label: "Đã gửi" },
  { key: "read", label: "PH đã đọc" },
];

export function ReportListScreen({ navigation }: Props) {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: reports = [], isLoading, refetch } = useMyReports();

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const name = Array.isArray(r.student_id) ? r.student_id[1] : "";
      const matchSearch =
        !search || name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [reports, search, statusFilter]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Searchbar
        placeholder="Tìm theo tên học sinh..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />
      <View style={styles.chips}>
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.key}
            mode="outlined"
            selected={statusFilter === f.key}
            onPress={() => setStatusFilter(f.key)}
            style={[
              styles.chip,
              statusFilter === f.key && {
                backgroundColor: theme.colors.primary,
              },
            ]}
            showSelectedCheck={false}
            textStyle={[
              statusFilter === f.key && { color: theme.colors.onPrimary },
            ]}
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
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} />
          }
          renderItem={({ item }) => (
            <ReportListCard
              report={item}
              onPress={() =>
                navigation.navigate("ReportDetail", { reportId: item.id })
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState icon="file-document-outline" title="Không có báo cáo" />
          }
        />
      )}

      <FAB
        icon="plus"
        label="Tạo mới"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => navigation.navigate("ReportCreate", {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  search: { margin: 16, marginBottom: 8 },
  chips: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 4,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  chip: { borderRadius: 20 },
  fab: { position: "absolute", right: 16, bottom: 16, borderRadius: 16 },
});
