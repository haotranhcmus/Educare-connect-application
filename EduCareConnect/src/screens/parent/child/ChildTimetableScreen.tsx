import React, { useMemo, useState } from "react";
import { View, FlatList, StyleSheet, RefreshControl } from "react-native";
import { Text, useTheme, type MD3Theme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { EmptyState } from "../../../components/common/EmptyState";
import SessionPlaceholder from "../../../../assets/placeholder/session-placeholder.svg";
import { MiniCalendar } from "../../../components/common/MiniCalendar";
import { useStudentTimetable } from "../../../hooks/useParent";
import { useParentStore } from "../../../store/parentStore";
import {
  formatFloatTime,
  formatWeekdayDayMonth,
} from "../../../utils/formatters";
import { getInitials, hashColor } from "../../../components/common/AvatarLabel";

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    bg: string;
    color: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
  }
> = {
  scheduled: {
    label: "Đã lên lịch",
    bg: "#E3F2FD",
    color: "#1565C0",
    icon: "calendar-clock",
  },
  completed: {
    label: "Đã học",
    bg: "#E8F5E9",
    color: "#2E7D32",
    icon: "check-circle-outline",
  },
  done: {
    label: "Đã học",
    bg: "#E8F5E9",
    color: "#2E7D32",
    icon: "check-circle-outline",
  },
  cancelled: {
    label: "Đã huỷ",
    bg: "#FFEBEE",
    color: "#C62828",
    icon: "close-circle-outline",
  },
  draft: {
    label: "Nháp",
    bg: "#F5F5F5",
    color: "#757575",
    icon: "pencil-outline",
  },
};

const SESSION_TYPE_LABELS: Record<string, string> = {
  individual: "Cá nhân (1:1)",
  small_group: "Nhóm nhỏ (2-4 học viên)",
  consultation: "Tư vấn",
};

// ("individual", "Cá nhân (1:1)"),
// ("small_group", "Nhóm nhỏ (2-4 học viên)"),
// ("consultation", "Tư vấn"),

// ── SessionCard ────────────────────────────────────────────────────────────────

function SessionCard({ session, theme }: { session: any; theme: MD3Theme }) {
  const cfg = STATUS_CONFIG[session.status] ?? {
    label: session.status,
    bg: "#F5F5F5",
    color: "#757575",
    icon: "calendar-blank-outline" as keyof typeof MaterialCommunityIcons.glyphMap,
  };
  const teacherName = Array.isArray(session.teacher_id)
    ? session.teacher_id[1]
    : null;
  const timeRange = `${formatFloatTime(session.start_time)}–${formatFloatTime(session.end_time)}`;
  const sessionTypeLabel =
    SESSION_TYPE_LABELS[session.session_type] ?? session.session_type ?? "";
  const initials = teacherName ? getInitials(teacherName) : "?";
  const avatarColor = teacherName
    ? hashColor(teacherName)
    : theme.colors.primary;

  return (
    <View
      style={[
        styles.sessionCard,
        {
          backgroundColor: theme.colors.surface,
          borderLeftColor: cfg.color,
        },
      ]}
    >
      {/* Time + status */}
      <View style={styles.timeRow}>
        <Text
          variant="titleSmall"
          style={{ fontWeight: "800", color: theme.colors.onSurface, flex: 1 }}
        >
          {timeRange}
        </Text>
        <View style={[styles.statusChip, { backgroundColor: cfg.bg }]}>
          <MaterialCommunityIcons name={cfg.icon} size={12} color={cfg.color} />
          <Text style={[styles.chipText, { color: cfg.color }]}>
            {cfg.label}
          </Text>
        </View>
      </View>

      {/* Teacher */}
      {teacherName && (
        <View style={styles.teacherRow}>
          <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}
          >
            {teacherName}
          </Text>
          {sessionTypeLabel ? (
            <View
              style={[
                styles.typeChip,
                {
                  borderColor: theme.colors.outlineVariant,
                  marginLeft: "auto",
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {sessionTypeLabel}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

// ── DaySection ─────────────────────────────────────────────────────────────────

function DaySection({
  dateStr,
  sessions,
  today,
  theme,
}: {
  dateStr: string;
  sessions: any[];
  today: string;
  theme: MD3Theme;
}) {
  const isToday = dateStr === today;
  return (
    <View style={styles.daySection}>
      <View
        style={[
          styles.dayHeader,
          isToday && { backgroundColor: theme.colors.primaryContainer },
        ]}
      >
        <View
          style={[
            styles.dayDot,
            {
              backgroundColor: isToday
                ? theme.colors.primary
                : theme.colors.outline,
            },
          ]}
        />
        <Text
          variant="labelMedium"
          style={{
            fontWeight: "700",
            color: isToday ? theme.colors.primary : theme.colors.onSurface,
          }}
        >
          {formatWeekdayDayMonth(dateStr)}
        </Text>
        {isToday && (
          <View
            style={[
              styles.todayChip,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={styles.todayChipText}>Hôm nay</Text>
          </View>
        )}
        <Text
          variant="labelSmall"
          style={{ color: theme.colors.outline, flex: 1, textAlign: "right" }}
        >
          {sessions.length} buổi
        </Text>
      </View>
      {sessions.map((s) => (
        <SessionCard key={s.id} session={s} theme={theme} />
      ))}
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export function ChildTimetableScreen() {
  const theme = useTheme();
  const { selectedStudentId } = useParentStore();
  const studentId = selectedStudentId ?? 0;

  const [calMonth, setCalMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<string>(
    dayjs().format("YYYY-MM-DD"),
  );

  const dateFrom = calMonth.startOf("month").format("YYYY-MM-DD");
  const dateTo = calMonth.endOf("month").format("YYYY-MM-DD");

  const {
    data: sessions = [],
    isLoading,
    refetch,
    isRefetching,
  } = useStudentTimetable(studentId, dateFrom, dateTo);

  const visibleSessions = useMemo(
    () => sessions.filter((session: any) => session.status !== "draft"),
    [sessions],
  );

  const today = dayjs().format("YYYY-MM-DD");

  const sessionDates = useMemo(
    () => new Set(visibleSessions.map((s: any) => s.session_date as string)),
    [visibleSessions],
  );

  const grouped = useMemo(() => {
    const filtered = selectedDate
      ? visibleSessions.filter((s: any) => s.session_date === selectedDate)
      : visibleSessions;
    const map = new Map<string, any[]>();
    for (const s of filtered) {
      const key = s.session_date as string;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [visibleSessions, selectedDate]);

  if (isLoading) return <LoadingOverlay visible />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Month calendar */}
      <MiniCalendar
        month={calMonth}
        sessionDates={sessionDates}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onPrevMonth={() => setCalMonth((m) => m.subtract(1, "month"))}
        onNextMonth={() => setCalMonth((m) => m.add(1, "month"))}
      />

      {/* Session list */}
      {grouped.length === 0 ? (
        <EmptyState
          image={SessionPlaceholder}
          title="Không có buổi học nào"
          description={
            selectedDate
              ? `Không có buổi học nào vào ngày ${dayjs(selectedDate).format("DD/MM/YYYY")}`
              : "Không có buổi học nào trong tháng này"
          }
        />
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={([dateStr]) => dateStr}
          renderItem={({ item: [dateStr, items] }) => (
            <DaySection
              dateStr={dateStr}
              sessions={items}
              today={today}
              theme={theme}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  daySection: { marginBottom: 8 },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
    gap: 8,
  },
  dayDot: { width: 8, height: 8, borderRadius: 4 },
  todayChip: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  todayChipText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  sessionCard: {
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
    paddingLeft: 14,
    elevation: 1,
    gap: 8,
    borderLeftWidth: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  teacherRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  typeChip: {
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
