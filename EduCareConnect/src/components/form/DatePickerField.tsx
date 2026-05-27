import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Text as RNText,
  Modal,
} from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs, { Dayjs } from "dayjs";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function buildWeeks(month: Dayjs): (number | null)[][] {
  const first = month.startOf("month");
  const offset = (first.day() + 6) % 7; // Mon = 0
  const days = month.daysInMonth();
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (v: string) => void;
  disablePast?: boolean;
  minDate?: string; // YYYY-MM-DD — takes precedence over disablePast
}

export function DatePickerField({
  label,
  value,
  onChange,
  disablePast,
  minDate,
}: DatePickerFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const p = dayjs(value);
    return p.isValid() ? p : dayjs();
  });

  const displayValue = value ? dayjs(value).format("DD/MM/YYYY") : "";
  const today = dayjs().format("YYYY-MM-DD");

  const onOpen = () => {
    const p = dayjs(value);
    setCalMonth(p.isValid() ? p : dayjs());
    setOpen(true);
  };

  const weeks = buildWeeks(calMonth);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onOpen} activeOpacity={0.8}>
        <View pointerEvents="none">
          <TextInput
            label={label}
            value={displayValue}
            mode="outlined"
            dense
            editable={false}
            right={<TextInput.Icon icon="calendar" />}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)} />
          <View
            style={[styles.sheet, { backgroundColor: theme.colors.surface }]}
          >
            <View style={styles.handle} />

            {/* Month navigation */}
            <View style={styles.monthRow}>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => setCalMonth((m) => m.subtract(1, "month"))}
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={24}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
              <RNText
                style={[styles.monthLabel, { color: theme.colors.onSurface }]}
              >
                Tháng {calMonth.format("MM / YYYY")}
              </RNText>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => setCalMonth((m) => m.add(1, "month"))}
              >
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Weekday header */}
            <View style={styles.gridRow}>
              {WEEKDAYS.map((d) => (
                <RNText
                  key={d}
                  style={[styles.weekLabel, { color: theme.colors.outline }]}
                >
                  {d}
                </RNText>
              ))}
            </View>

            {/* Calendar days */}
            {weeks.map((week, wi) => (
              <View key={wi} style={styles.gridRow}>
                {week.map((day, di) => {
                  if (!day) return <View key={di} style={styles.dayCell} />;
                  const dateStr = calMonth.date(day).format("YYYY-MM-DD");
                  const effectiveMin =
                    minDate ?? (disablePast ? today : undefined);
                  const isDisabled = !!effectiveMin && dateStr < effectiveMin;
                  const isSelected = dateStr === value;
                  const isToday = dateStr === today;
                  return (
                    <TouchableOpacity
                      key={di}
                      style={styles.dayCell}
                      onPress={
                        isDisabled
                          ? undefined
                          : () => {
                              onChange(dateStr);
                              setOpen(false);
                            }
                      }
                      disabled={isDisabled}
                      activeOpacity={isDisabled ? 1 : 0.7}
                    >
                      <View
                        style={[
                          styles.dayCircle,
                          isSelected &&
                            !isDisabled && {
                              backgroundColor: theme.colors.primary,
                            },
                          isToday &&
                            !isSelected &&
                            !isDisabled && {
                              borderWidth: 1.5,
                              borderColor: theme.colors.primary,
                            },
                        ]}
                      >
                        <RNText
                          style={[
                            styles.dayText,
                            {
                              color: isDisabled
                                ? theme.colors.outlineVariant
                                : isSelected
                                  ? theme.colors.onPrimary
                                  : theme.colors.onSurface,
                            },
                            isToday &&
                              !isSelected &&
                              !isDisabled && {
                                color: theme.colors.primary,
                                fontWeight: "700",
                              },
                          ]}
                        >
                          {day}
                        </RNText>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            <View style={{ height: 16 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    elevation: 10,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  navBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: { fontSize: 15, fontWeight: "700" },
  gridRow: { flexDirection: "row" },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    paddingVertical: 6,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 3,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { fontSize: 14 },
});
