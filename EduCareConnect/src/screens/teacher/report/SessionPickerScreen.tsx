import React, { useState, useMemo } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Searchbar, Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SessionPickerCard } from "../../../components/report/SessionPickerCard";
import { EmptyState } from "../../../components/common/EmptyState";
import SessionPlaceholder from "../../../../assets/placeholder/session-placeholder.svg";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { useSessionsForReport } from "../../../hooks/useReports";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ReportStackParamList } from "../../../navigation/types";
import { theme } from "@/src/theme";

type Props = NativeStackScreenProps<ReportStackParamList, "SessionPicker">;

export function SessionPickerScreen({ navigation }: Props) {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const { data: sessions = [], isLoading } = useSessionsForReport();

  const filtered = useMemo(() => {
    if (!search) return sessions;
    const q = search.toLowerCase();
    return sessions.filter((s) => {
      const name = Array.isArray(s.student_id) ? s.student_id[1] : "";
      return name.toLowerCase().includes(q);
    });
  }, [sessions, search]);

  const handleSelect = (sessionId: number) => {
    // Navigate back to ReportCreate with the selected session ID
    navigation.navigate("ReportCreate", { sessionId });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Searchbar
        placeholder="Tìm theo tên học sinh..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
        elevation={0}
      />

      {/* Count row */}
      <View style={styles.countRow}>
        <MaterialCommunityIcons
          name="clipboard-list-outline"
          size={14}
          color={theme.colors.outline}
        />
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.outline, marginLeft: 4 }}
        >
          {filtered.length} buổi chưa có báo cáo
        </Text>
      </View>

      {isLoading ? (
        <LoadingOverlay visible />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          renderItem={({ item }) => (
            <SessionPickerCard session={item} onSelect={handleSelect} />
          )}
          ListEmptyComponent={
            search ? (
              <EmptyState
                image={SessionPlaceholder}
                title="Không tìm thấy buổi học"
                description="Không có buổi học chưa có báo cáo cho học sinh này."
              />
            ) : (
              <EmptyState
                icon="check-circle-outline"
                title="Tất cả buổi học đã có báo cáo đầy đủ!"
              />
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 0,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
});
