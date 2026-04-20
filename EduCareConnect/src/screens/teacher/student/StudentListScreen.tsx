import React, { useState, useMemo } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Searchbar, Chip, useTheme } from "react-native-paper";
import { useMyStudents } from "../../../hooks/useStudents";
import { StudentListCard } from "../../../components/student/StudentListCard";
import { EmptyState } from "../../../components/common/EmptyState";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { StudentStackParamList } from "../../../navigation/types";

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

      {/* Search */}
      <Searchbar
        placeholder="Tìm theo tên hoặc mã HS"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchbar}
      />

      {/* Filter Chips */}
      <View style={styles.chips}>
        {(["all", "active", "inactive"] as StatusFilter[]).map((f) => (
          <Chip
            key={f}
            mode="outlined"
            selected={statusFilter === f}
            onPress={() => setStatusFilter(f)}
            style={styles.chip}
          >
            {f === "all"
              ? `Tất cả (${students.length})`
              : f === "active"
                ? "Active"
                : "Inactive"}
          </Chip>
        ))}
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
  container: { flex: 1 },
  searchbar: { margin: 16, marginBottom: 8 },
  chips: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  chip: { borderRadius: 20 },
  list: { flexGrow: 1, paddingBottom: 16 },
});