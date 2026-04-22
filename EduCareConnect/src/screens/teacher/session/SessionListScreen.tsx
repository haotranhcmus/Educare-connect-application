import React, { useState, useMemo } from "react";
import { View, SectionList, StyleSheet, RefreshControl } from "react-native";
import { Searchbar, Chip, Text, FAB, useTheme } from "react-native-paper";
import { SessionListCard } from "../../../components/session/SessionListCard";
import { EmptyState } from "../../../components/common/EmptyState";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { useMySessions } from "../../../hooks/useSessions";
import { formatDate } from "../../../utils/formatters";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SessionStackParamList } from "../../../navigation/types";
import type { SessionListItem } from "../../../types";
import { theme } from "@/src/theme/theme";

type Props = NativeStackScreenProps<SessionStackParamList, "SessionList">;

const DATE_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "today", label: "Hôm nay" },
  { key: "week", label: "Tuần này" },
];

function getDateRange(key: string) {
  if (key === "all") return {};
  const now = new Date();
  const dateFrom = new Date(now);
  if (key === "today") {
    // just today
  } else if (key === "week") {
    const day = now.getDay();
    dateFrom.setDate(now.getDate() - (day === 0 ? 6 : day - 1)); // Monday
  }
  return {
    dateFrom: dateFrom.toISOString().split("T")[0],
    dateTo: now.toISOString().split("T")[0],
  };
}

function groupByDate(sessions: SessionListItem[]) {
  const map = new Map<string, SessionListItem[]>();
  for (const s of sessions) {
    const key = s.session_date;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, data]) => ({ title: date, data }));
}

export function SessionListScreen({ navigation }: Props) {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const filters = useMemo(() => getDateRange(dateFilter), [dateFilter]);
  const { data: sessions = [], isLoading, refetch } = useMySessions(filters);

  const filtered = useMemo(() => {
    if (!search) return sessions;
    const q = search.toLowerCase();
    return sessions.filter((s: SessionListItem) => {
      const name = Array.isArray(s.student_id) ? s.student_id[1] : "";
      return (
        name.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q)
      );
    });
  }, [sessions, search]);

  const sections = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Searchbar
        placeholder="Tìm theo tên học sinh..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />
      <View style={styles.chips}>
        {DATE_FILTERS.map((f) => (
          <Chip
            key={f.key}
            selected={dateFilter === f.key}
            onPress={() => setDateFilter(f.key)}
            style={[
              styles.chip,
              dateFilter === f.key && { backgroundColor: theme.colors.primary },
            ]}
            showSelectedCheck={false}
            textStyle={[
              dateFilter === f.key && { color: theme.colors.onPrimary },
            ]}
          >
            {f.label}
          </Chip>
        ))}
      </View>

      {isLoading ? (
        <LoadingOverlay visible={isLoading} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} />
          }
          renderSectionHeader={({ section }) => (
            <Text
              variant="labelMedium"
              style={[styles.sectionHeader, { color: theme.colors.outline }]}
            >
              {formatDate(section.title)}
            </Text>
          )}
          renderItem={({ item }) => (
            <SessionListCard
              session={item}
              onPress={() =>
                navigation.navigate("SessionDetail", { sessionId: item.id })
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-blank-outline"
              title="Không có buổi học"
            />
          }
        />
      )}

      <FAB
        icon="plus"
        label="Tạo mới"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => {
          // Place Holder for Create Session
          navigation.navigate("SessionCreate", {});
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  search: { margin: 16, marginBottom: 8 },
  chips: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 8 },
  sectionHeader: { paddingVertical: 8, fontWeight: "600" },
  fab: { position: "absolute", right: 16, bottom: 16, borderRadius: 16 },
  chip: {
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.outline,
    borderWidth: 1,
  },
});
