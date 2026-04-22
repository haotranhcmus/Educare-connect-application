import React, { useState, useMemo } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Searchbar, Text, IconButton, useTheme } from "react-native-paper";
import { SessionPickerCard } from "../../../components/report/SessionPickerCard";
import { EmptyState } from "../../../components/common/EmptyState";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { useSessionsForReport } from "../../../hooks/useReports";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ReportStackParamList } from "../../../navigation/types";

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
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="close" onPress={() => navigation.goBack()} />
        <Text variant="titleMedium" style={{ flex: 1 }}>
          Chọn buổi học
        </Text>
      </View>

      <Searchbar
        placeholder="Tìm theo tên học sinh..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      <Text variant="bodySmall" style={styles.count}>
        📋 {filtered.length} buổi chưa có báo cáo
      </Text>

      {isLoading ? (
        <LoadingOverlay visible />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <SessionPickerCard session={item} onSelect={handleSelect} />
          )}
          ListEmptyComponent={
            search ? (
              <EmptyState
                icon="magnify-close"
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
  header: { flexDirection: "row", alignItems: "center", paddingRight: 16 },
  search: { marginHorizontal: 16, marginBottom: 8 },
  count: { paddingHorizontal: 16, marginBottom: 8, opacity: 0.7 },
});
