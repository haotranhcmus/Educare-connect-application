import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text as RNText,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs, { Dayjs } from "dayjs";

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export interface MiniCalendarProps {
  month: Dayjs;
  sessionDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function MiniCalendar({
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
  const startOffset = (firstOfMonth.day() + 6) % 7; // Mon=0
  const daysInMonth = month.daysInMonth();

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const monthLabel = month.format("MM / YYYY");

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.surface }]}>
      {/* Month navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.navBtn}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={22}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
        <Text variant="titleSmall" style={{ fontWeight: "700" }}>
          Tháng {monthLabel}
        </Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.navBtn}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Weekday labels */}
      <View style={styles.row}>
        {WEEKDAY_LABELS.map((d) => (
          <Text
            key={d}
            style={[styles.weekLabel, { color: theme.colors.outline }]}
          >
            {d}
          </Text>
        ))}
      </View>

      {/* Day cells */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.row}>
          {week.map((day, di) => {
            if (!day) return <View key={di} style={styles.cell} />;
            const dateStr = month.date(day).format("YYYY-MM-DD");
            const hasSession = sessionDates.has(dateStr);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === today;
            return (
              <TouchableOpacity
                key={di}
                style={styles.cell}
                onPress={() => onSelectDate(isSelected ? "" : dateStr)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isSelected && {
                      backgroundColor: theme.colors.primary,
                    },
                    isToday &&
                      !isSelected && {
                        borderWidth: 1,
                        borderColor: theme.colors.primary,
                      },
                    isToday &&
                      isSelected && {
                        backgroundColor: theme.colors.primary,
                        borderWidth: 1,
                        borderColor: theme.colors.primary,
                      },
                  ]}
                >
                  <RNText
                    style={[
                      styles.dayText,
                      isSelected
                        ? { color: theme.colors.onPrimary }
                        : { color: theme.colors.onSurface },
                      isToday && !isSelected && { color: theme.colors.primary },
                    ]}
                  >
                    {day}
                  </RNText>
                </View>
                {hasSession && (
                  <View
                    style={[
                      styles.dot,
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

const styles = StyleSheet.create({
  wrapper: {
    margin: 16,
    borderRadius: 16,
    padding: 8,
    elevation: 2,
    // shadowColor: "#000",
    // shadowOpacity: 0.06,
    // shadowRadius: 6,
    // shadowOffset: { width: 0, height: 2 },
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
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
