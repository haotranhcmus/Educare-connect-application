import React, { useMemo, useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Text, useTheme, type MD3Theme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { EmptyState } from "../../../components/common/EmptyState";
import { useStudentTimetable } from "../../../hooks/useParent";
import { useParentStore } from "../../../store/parentStore";
import { formatFloatTime } from "../../../utils/formatters";

// ── Constants ──────────────────────────────────────────────────────────────────

const LOCATION_LABELS: Record<string, string> = {
  center: "Tại trung tâm",
  home: "Tại nhà",
  online: "Trực tuyến",
};

const LOCATION_ICONS: Record<
  string,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  center: "home-city-outline",
  home: "home-outline",
  online: "laptop",
};

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
    label: "Hoàn thành",
    bg: "#E8F5E9",
    color: "#2E7D32",
    icon: "check-circle-outline",
  },
  done: {
    label: "Hoàn thành",
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

const WEEK_DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(d.getDate() + n);
  return date;
}

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const dayNames = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dayNames[d.getDay()]} ${dd}/${mm}`;
}

function formatMonthRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const mmStart = String(monday.getMonth() + 1).padStart(2, "0");
  const mmEnd = String(sunday.getMonth() + 1).padStart(2, "0");
  if (mmStart === mmEnd) {
    return `Tuần ${String(monday.getDate()).padStart(2, "0")}–${String(sunday.getDate()).padStart(2, "0")}/${mmEnd}/${sunday.getFullYear()}`;
  }
  return `${String(monday.getDate()).padStart(2, "0")}/${mmStart}–${String(sunday.getDate()).padStart(2, "0")}/${mmEnd}/${sunday.getFullYear()}`;
}

// ── SessionCard ────────────────────────────────────────────────────────────────

function SessionCard({ session, theme }: { session: any; theme: MD3Theme }) {
  const cfg = STATUS_CONFIG[session.status] ?? {
    label: session.status,
    bg: "#F5F5F5",
    color: "#757575",
    icon: "calendar-blank-outline" as keyof typeof MaterialCommunityIcons.glyphMap,
  };
  const locationIcon = LOCATION_ICONS[session.location] ?? "map-marker-outline";
  const teacherName = Array.isArray(session.teacher_id)
    ? session.teacher_id[1]
    : null;

  return (
    <View
      style={[styles.sessionCard, { backgroundColor: theme.colors.surface }]}
    >
      {/* Time column */}
      <View style={styles.timeCol}>
        <Text
          variant="labelMedium"
          style={{ color: theme.colors.primary, fontWeight: "700" }}
        >
          {formatFloatTime(session.start_time)}
        </Text>
        <View
          style={[
            styles.timeLine,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        />
        <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
          {formatFloatTime(session.end_time)}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.sessionContent}>
        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <MaterialCommunityIcons name={cfg.icon} size={12} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>
            {cfg.label}
          </Text>
        </View>

        {/* Duration */}
        {session.duration > 0 && (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={13}
              color={theme.colors.outline}
            />
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.outline, marginLeft: 4 }}
            >
              {Math.round(session.duration)} phút
            </Text>
          </View>
        )}

        {/* Location */}
        {session.location && (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons
              name={locationIcon}
              size={13}
              color={theme.colors.outline}
            />
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.outline, marginLeft: 4 }}
            >
              {LOCATION_LABELS[session.location] ?? session.location}
            </Text>
          </View>
        )}

        {/* Teacher */}
        {teacherName && (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons
              name="account-outline"
              size={13}
              color={theme.colors.outline}
            />
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.outline, marginLeft: 4 }}
            >
              {teacherName}
            </Text>
          </View>
        )}

        {/* Accuracy */}
        {session.avg_accuracy != null && session.avg_accuracy > 0 && (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons
              name="star-outline"
              size={13}
              color="#F9A825"
            />
            <Text
              variant="bodySmall"
              style={{ color: "#F9A825", marginLeft: 4 }}
            >
              Độ chính xác TB: {Math.round(session.avg_accuracy)}%
            </Text>
          </View>
        )}
      </View>
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
          {formatDayLabel(dateStr)}
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

// ── WeekStrip ──────────────────────────────────────────────────────────────────

function WeekStrip({
  monday,
  sessionDates,
  onPrev,
  onNext,
  theme,
}: {
  monday: Date;
  sessionDates: Set<string>;
  onPrev: () => void;
  onNext: () => void;
  theme: MD3Theme;
}) {
  const today = toISODate(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <View style={[styles.weekStrip, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity onPress={onPrev} style={styles.weekNav}>
        <MaterialCommunityIcons
          name="chevron-left"
          size={22}
          color={theme.colors.primary}
        />
      </TouchableOpacity>

      <View style={styles.weekDays}>
        {days.map((d, i) => {
          const dateStr = toISODate(d);
          const isToday = dateStr === today;
          const hasSessions = sessionDates.has(dateStr);
          return (
            <View key={dateStr} style={styles.dayCol}>
              <Text
                variant="labelSmall"
                style={{
                  color: isToday ? theme.colors.primary : theme.colors.outline,
                  fontWeight: isToday ? "700" : "400",
                }}
              >
                {WEEK_DAYS[i]}
              </Text>
              <Text
                variant="labelMedium"
                style={{
                  fontWeight: isToday ? "700" : "500",
                  color: isToday
                    ? theme.colors.primary
                    : theme.colors.onSurface,
                  marginTop: 2,
                }}
              >
                {d.getDate()}
              </Text>
              <View
                style={[
                  styles.sessionDot,
                  {
                    backgroundColor: hasSessions
                      ? theme.colors.primary
                      : "transparent",
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      <TouchableOpacity onPress={onNext} style={styles.weekNav}>
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={theme.colors.primary}
        />
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export function ChildTimetableScreen() {
  const theme = useTheme();
  const { selectedStudentId } = useParentStore();
  const studentId = selectedStudentId ?? 0;

  const [weekOffset, setWeekOffset] = useState(0);

  const thisMonday = useMemo(() => {
    const base = getMondayOfWeek(new Date());
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const dateFrom = toISODate(thisMonday);
  const dateTo = toISODate(addDays(thisMonday, 6));

  const {
    data: sessions = [],
    isLoading,
    refetch,
    isRefetching,
  } = useStudentTimetable(studentId, dateFrom, dateTo);

  const today = toISODate(new Date());

  const sessionDates = useMemo(
    () => new Set(sessions.map((s: any) => s.session_date as string)),
    [sessions],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    // Fill all 7 days so we display all days
    for (let i = 0; i < 7; i++) {
      const d = toISODate(addDays(thisMonday, i));
      map.set(d, []);
    }
    for (const s of sessions) {
      const key = s.session_date as string;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .filter(([, items]) => items.length > 0); // only show days with sessions
  }, [sessions, thisMonday]);

  if (isLoading) return <LoadingOverlay visible />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Week range label */}
      <View
        style={[
          styles.rangeBar,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <MaterialCommunityIcons
          name="calendar-week"
          size={16}
          color={theme.colors.primary}
        />
        <Text
          variant="labelMedium"
          style={{ marginLeft: 6, color: theme.colors.onSurfaceVariant }}
        >
          {formatMonthRange(thisMonday)}
        </Text>
      </View>

      {/* Week strip */}
      <WeekStrip
        monday={thisMonday}
        sessionDates={sessionDates}
        onPrev={() => setWeekOffset((n) => n - 1)}
        onNext={() => setWeekOffset((n) => n + 1)}
        theme={theme}
      />

      {/* Session list */}
      {grouped.length === 0 ? (
        <EmptyState
          icon="calendar-blank-outline"
          title="Không có buổi học nào"
          description="Không có buổi học nào được lên lịch trong tuần này"
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
  rangeBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  weekStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    elevation: 1,
  },
  weekNav: { width: 36, alignItems: "center" },
  weekDays: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  dayCol: { alignItems: "center", gap: 2 },
  sessionDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
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
    flexDirection: "row",
    borderRadius: 10,
    marginBottom: 8,
    padding: 12,
    elevation: 1,
  },
  timeCol: { alignItems: "center", width: 52, marginRight: 12 },
  timeLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginVertical: 4,
    borderRadius: 2,
  },
  sessionContent: { flex: 1, gap: 4 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
    marginBottom: 4,
  },
  statusText: { fontSize: 11, fontWeight: "600" },
  metaRow: { flexDirection: "row", alignItems: "center" },
});
