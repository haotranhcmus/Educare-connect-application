import React, { useState, useMemo } from "react";
import {
  View,
  SectionList,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import {
  Searchbar,
  Chip,
  Text,
  FAB,
  IconButton,
  useTheme,
  Button,
} from "react-native-paper";
import dayjs, { Dayjs } from "dayjs";
import { SessionListCard } from "../../../components/session/SessionListCard";
import { EmptyState } from "../../../components/common/EmptyState";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { useMySessions } from "../../../hooks/useSessions";
import { formatDate } from "../../../utils/formatters";
import { logger } from "../../../utils/logger";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SessionStackParamList } from "../../../navigation/types";
import type { SessionListItem } from "../../../types";
import { theme as appTheme } from "@/src/theme/theme";

type Props = NativeStackScreenProps<SessionStackParamList, "SessionList">;

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const DATE_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "today", label: "Hôm nay" },
  { key: "week", label: "Tuần này" },
];

function getDateRange(key: string) {
  if (key === "all") return {};
  const now = new Date();
  const dateFrom = new Date(now);
  if (key === "week") {
    const day = now.getDay();
    dateFrom.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
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

// ─── Mini Calendar ─────────────────────────────────────────────────────────────

interface MiniCalendarProps {
  month: Dayjs;
  sessionDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function MiniCalendar({
  month,
  sessionDates,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: MiniCalendarProps) {
  const theme = useTheme();
  const today = dayjs().format("YYYY-MM-DD");

  // Build grid: ISO week starts Monday
  const firstOfMonth = month.startOf("month");
  // dayjs isoWeekday: 1=Mon … 7=Sun; fallback with day()
  const startOffset = (firstOfMonth.day() + 6) % 7; // Mon=0
  const daysInMonth = month.daysInMonth();

  // Pad front with nulls then fill days
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const monthLabel = month.format("MM / YYYY");

  return (
    <View
      style={[calStyles.wrapper, { backgroundColor: theme.colors.surface }]}
    >
      {/* Month navigation */}
      <View style={calStyles.header}>
        <IconButton icon="chevron-left" size={20} onPress={onPrevMonth} />
        <Text variant="titleSmall" style={{ fontWeight: "700" }}>
          Tháng {monthLabel}
        </Text>
        <IconButton icon="chevron-right" size={20} onPress={onNextMonth} />
      </View>

      {/* Weekday labels */}
      <View style={calStyles.row}>
        {WEEKDAY_LABELS.map((d) => (
          <Text
            key={d}
            style={[calStyles.weekLabel, { color: theme.colors.outline }]}
          >
            {d}
          </Text>
        ))}
      </View>

      {/* Day cells */}
      {weeks.map((week, wi) => (
        <View key={wi} style={calStyles.row}>
          {week.map((day, di) => {
            if (!day) return <View key={di} style={calStyles.cell} />;
            const dateStr = month.date(day).format("YYYY-MM-DD");
            const hasSession = sessionDates.has(dateStr);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === today;
            return (
              <TouchableOpacity
                key={di}
                style={calStyles.cell}
                onPress={() => onSelectDate(isSelected ? "" : dateStr)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    calStyles.dayCircle,
                    isSelected && {
                      backgroundColor: theme.colors.primary,
                    },
                    isToday &&
                      !isSelected && {
                        borderWidth: 1.5,
                        borderColor: theme.colors.primary,
                      },
                  ]}
                >
                  <Text
                    style={[
                      calStyles.dayText,
                      isSelected
                        ? { color: theme.colors.onPrimary }
                        : isToday
                          ? { color: theme.colors.primary }
                          : { color: theme.colors.onSurface },
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                {hasSession && (
                  <View
                    style={[
                      calStyles.dot,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.onPrimary
                          : theme.colors.primary,
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export function SessionListScreen({ navigation }: Props) {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<string>("");

  const filters = useMemo(() => getDateRange(dateFilter), [dateFilter]);
  const {
    data: sessions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useMySessions(filters);

  if (isError) {
    const errorMsg =
      (error as any)?.message || "Không thể tải danh sách buổi học.";
    logger.error("SessionListScreen", "render error state", {
      errorMsg,
      odooError: (error as any)?.odooError,
    });
  }

  const sessionDates = useMemo(
    () => new Set(sessions.map((s: SessionListItem) => s.session_date)),
    [sessions],
  );

  const filtered = useMemo(() => {
    let list = sessions as SessionListItem[];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => {
        const name = Array.isArray(s.student_id) ? s.student_id[1] : "";
        return (
          name.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q)
        );
      });
    }
    if (viewMode === "calendar" && selectedDate) {
      list = list.filter((s) => s.session_date === selectedDate);
    }
    return list;
  }, [sessions, search, viewMode, selectedDate]);

  const sections = useMemo(() => groupByDate(filtered), [filtered]);

  const toggleView = () => {
    setViewMode((v) => (v === "list" ? "calendar" : "list"));
    setSelectedDate("");
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Search + view toggle */}
      <View style={styles.searchRow}>
        <Searchbar
          placeholder="Tìm theo tên học sinh..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />
        <IconButton
          icon={
            viewMode === "list"
              ? "calendar-month-outline"
              : "format-list-bulleted"
          }
          size={24}
          iconColor={theme.colors.primary}
          onPress={toggleView}
          style={styles.toggleBtn}
        />
      </View>

      {/* Date chips — hidden in calendar mode */}
      {viewMode === "list" && (
        <View style={styles.chips}>
          {DATE_FILTERS.map((f) => (
            <Chip
              key={f.key}
              selected={dateFilter === f.key}
              onPress={() => setDateFilter(f.key)}
              style={[
                styles.chip,
                dateFilter === f.key && {
                  backgroundColor: theme.colors.primary,
                },
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
      )}

      {isLoading ? (
        <LoadingOverlay visible={isLoading} />
      ) : isError ? (
        /* ── Error State ───────────────────────────────────────── */
        <View style={styles.errorContainer}>
          <Text
            variant="titleSmall"
            style={{
              color: theme.colors.error,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Không tải được danh sách buổi học
          </Text>
          <Text
            variant="bodySmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
              marginBottom: 16,
              paddingHorizontal: 24,
            }}
          >
            {(error as any)?.message || "Lỗi kết nối hoặc quyền truy cập."}
          </Text>
          <Button mode="contained" onPress={() => refetch()} icon="refresh">
            Thử lại
          </Button>
        </View>
      ) : viewMode === "calendar" ? (
        /* ── Calendar View ─────────────────────────────────────── */
        <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
          <MiniCalendar
            month={calMonth}
            sessionDates={sessionDates}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onPrevMonth={() => setCalMonth((m) => m.subtract(1, "month"))}
            onNextMonth={() => setCalMonth((m) => m.add(1, "month"))}
          />
          {selectedDate ? (
            <>
              <Text
                variant="labelMedium"
                style={[
                  styles.sectionHeader,
                  { color: theme.colors.outline, paddingHorizontal: 16 },
                ]}
              >
                {formatDate(selectedDate)}
              </Text>
              {sections.length === 0 ? (
                <EmptyState
                  icon="calendar-blank-outline"
                  title="Không có buổi học ngày này"
                />
              ) : (
                sections.flatMap((sec) =>
                  sec.data.map((item) => (
                    <View key={item.id} style={{ paddingHorizontal: 16 }}>
                      <SessionListCard
                        session={item}
                        onPress={() =>
                          navigation.navigate("SessionDetail", {
                            sessionId: item.id,
                          })
                        }
                      />
                    </View>
                  )),
                )
              )}
            </>
          ) : (
            <EmptyState
              icon="gesture-tap"
              title="Chọn một ngày để xem buổi học"
            />
          )}
        </ScrollView>
      ) : (
        /* ── List View ─────────────────────────────────────────── */
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
        onPress={() => navigation.navigate("SessionCreate", {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
  search: { flex: 1 },
  toggleBtn: { marginLeft: 4 },
  chips: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 8 },
  sectionHeader: { paddingVertical: 8, fontWeight: "600" },
  fab: { position: "absolute", right: 16, bottom: 16, borderRadius: 16 },
  chip: {
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: appTheme.colors.surface,
    borderColor: appTheme.colors.outline,
    borderWidth: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
});

const calStyles = StyleSheet.create({
  wrapper: {
    margin: 16,
    borderRadius: 16,
    padding: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  row: { flexDirection: "row" },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    paddingVertical: 6,
  },
  cell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  dayText: { fontSize: 13 },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
});
