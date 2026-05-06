import React, { useState, useMemo } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import {
  Searchbar,
  Menu,
  IconButton,
  Text as PaperText,
  useTheme,
} from "react-native-paper";
import { useMyStudents } from "../../../hooks/useStudents";
import { StudentListCard } from "../../../components/student/StudentListCard";
import { EmptyState } from "../../../components/common/EmptyState";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { StudentStackParamList } from "../../../navigation/types";
import { theme } from "@/src/theme";

type Props = NativeStackScreenProps<StudentStackParamList, "StudentList">;
type StatusFilter = "all" | "active" | "inactive";

export function StudentListScreen({ navigation }: Props) {
  const theme = useTheme();
  const {
    data: students = [],
    isLoading,
    refetch,
    isRefetching,
  } = useMyStudents();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  const activeCount = students.filter((s) => s.status === "active").length;
  const inactiveCount = students.filter((s) => s.status !== "active").length;

  const FILTER_LABELS: Record<StatusFilter, string> = {
    all: `Tất cả (${students.length})`,
    active: `Đang hoạt động (${activeCount})`,
    inactive: `Không hoạt động (${inactiveCount})`,
  };

  const filteredStudents = useMemo(() => {
    let result = students;

    // Status filter
    if (statusFilter === "active") {
      result = result.filter((s) => s.status === "active");
    } else if (statusFilter === "inactive") {
      result = result.filter((s) => s.status !== "active");
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.student_code.toLowerCase().includes(q),
      );
    }

    return result;
  }, [students, statusFilter, searchQuery]);

  const handlePress = (studentId: number) => {
    navigation.navigate("StudentDetail", { studentId });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <LoadingOverlay visible={isLoading} />

      {/* Search + Filter */}
      <View style={styles.searchRow}>
        <Searchbar
          placeholder="Tìm theo tên HS"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchbar}
        />
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={
            <IconButton
              icon="filter-variant"
              iconColor={
                statusFilter !== "all"
                  ? theme.colors.primary
                  : theme.colors.onSurfaceVariant
              }
              size={24}
              onPress={() => setFilterMenuVisible(true)}
            />
          }
        >
          {(["all", "active", "inactive"] as StatusFilter[]).map((f) => (
            <Menu.Item
              key={f}
              leadingIcon={statusFilter === f ? "check" : undefined}
              title={FILTER_LABELS[f]}
              onPress={() => {
                setStatusFilter(f);
                setFilterMenuVisible(false);
              }}
            />
          ))}
        </Menu>
      </View>

      {/* Student List */}
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <StudentListCard student={item} onPress={handlePress} />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="account-off"
              title="Chưa có học sinh"
              description={
                searchQuery
                  ? "Không tìm thấy kết quả"
                  : "Bạn chưa được phân công học sinh nào"
              }
            />
          ) : null
        }
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingVertical: 16 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 4,
    marginBottom: 4,
  },
  searchbar: {
    flex: 1,
    marginBottom: 0,
    backgroundColor: theme.colors.surface,
  },
  list: { flexGrow: 1, paddingBottom: 16 },
});
