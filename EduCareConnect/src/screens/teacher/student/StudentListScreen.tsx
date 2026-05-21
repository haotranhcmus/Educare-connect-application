import React, {
  useState,
  useMemo,
  useLayoutEffect,
  useCallback,
  Suspense,
} from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Searchbar, Menu, IconButton, useTheme } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMyStudentsSuspense } from "@hooks/useStudents";
import { StudentListCard } from "@components/student/StudentListCard";
import { EmptyState } from "@components/common/EmptyState";
// import StudentPlaceholder from "@assets/placeholder/svg/student-placeholder.svg";
import StudentPlaceholderJson from "@assets/placeholder/json/student-placeholder.json";
import type { StudentStackParamList } from "@navigation/types";
import { StudentListSkeleton } from "@screens/teacher/student/StudentListSkeleton";

type Props = NativeStackScreenProps<StudentStackParamList, "StudentList">;
type StatusFilter = "all" | "active" | "inactive";

// Defined outside component — stable style references for header
const headerSearchStyle = {
  backgroundColor: "rgba(255,255,255,0.18)",
  elevation: 0,
  height: 50,
  borderRadius: 10,
  marginBottom: 10,
};
const headerSearchInputStyle = { color: "#fff", fontSize: 13, paddingLeft: 0 };

function StudentListContent({ navigation }: Props) {
  const theme = useTheme();
  const { data: students, refetch, isRefetching } = useMyStudentsSuspense();

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

  const openMenu = useCallback(() => setFilterMenuVisible(true), []);
  const closeMenu = useCallback(() => setFilterMenuVisible(false), []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Searchbar
          placeholder="Tìm theo tên học sinh"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={headerSearchStyle}
          inputStyle={headerSearchInputStyle}
          iconColor="rgba(255,255,255,0.75)"
          placeholderTextColor="rgba(255,255,255,0.55)"
        />
      ),
      headerRight: () => (
        <Menu
          visible={filterMenuVisible}
          onDismiss={closeMenu}
          anchor={
            <IconButton
              icon="filter-variant"
              size={22}
              iconColor={statusFilter !== "all" ? "#A5D6A7" : "#fff"}
              onPress={openMenu}
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
                closeMenu();
              }}
            />
          ))}
        </Menu>
      ),
    });
  }, [
    navigation,
    searchQuery,
    statusFilter,
    filterMenuVisible,
    openMenu,
    closeMenu,
  ]);

  const filteredStudents = useMemo(() => {
    let result = students;
    if (statusFilter === "active") {
      result = result.filter((s) => s.status === "active");
    } else if (statusFilter === "inactive") {
      result = result.filter((s) => s.status !== "active");
    }
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

  const handlePress = useCallback(
    (studentId: number) => navigation.navigate("StudentDetail", { studentId }),
    [navigation],
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <StudentListCard student={item} onPress={handlePress} />
        )}
        ListEmptyComponent={
          <EmptyState
            lottie={StudentPlaceholderJson}
            title="Chưa có học sinh"
            description={
              searchQuery
                ? "Không tìm thấy kết quả"
                : "Bạn chưa được phân công học sinh nào"
            }
          />
        }
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

export function StudentListScreen(props: Props) {
  return (
    <Suspense fallback={<StudentListSkeleton />}>
      <StudentListContent {...props} />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingVertical: 16 },
  list: { flexGrow: 1, paddingBottom: 32 },
});
