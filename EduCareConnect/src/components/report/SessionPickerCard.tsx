import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text, useTheme, MD3Theme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AvatarLabel } from "../common/AvatarLabel";

interface SessionPickerCardProps {
  session: {
    id: number;
    name: string;
    student_id: [number, string] | false;
    session_date: string;
    duration: number;
    overall_performance: string | false;
    result_count: number;
  };
  onSelect: (sessionId: number) => void;
}

const PERF_MAP: Record<
  string,
  {
    label: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    color: string;
    bg: string;
  }
> = {
  excellent: {
    label: "Xuất sắc",
    icon: "star",
    color: "#F57C00",
    bg: "#FFF3E0",
  },
  good: { label: "Tốt", icon: "thumb-up", color: "#2E7D32", bg: "#E8F5E9" },
  average: {
    label: "Trung bình",
    icon: "minus-circle-outline",
    color: "#757575",
    bg: "#F5F5F5",
  },
  needs_support: {
    label: "Cần hỗ trợ",
    icon: "alert-circle-outline",
    color: "#D32F2F",
    bg: "#FFEBEE",
  },
};

export function SessionPickerCard({
  session,
  onSelect,
}: SessionPickerCardProps) {
  const theme = useTheme();
  const studentName = Array.isArray(session.student_id)
    ? session.student_id[1]
    : "(Không rõ)";
  const durationMin = Math.round(session.duration * 60);
  const perf = session.overall_performance
    ? PERF_MAP[session.overall_performance]
    : null;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      onPress={() => onSelect(session.id)}
      activeOpacity={0.7}
    >
      <View style={styles.mainRow}>
        {/* Avatar */}
        <AvatarLabel name={studentName} size={50} />

        {/* Info block */}
        <View style={styles.infoBlock}>
          {/* Name + performance badge */}
          <View style={styles.nameRow}>
            <Text
              variant="titleSmall"
              style={styles.studentName}
              numberOfLines={1}
            >
              {studentName}
            </Text>
            {perf && (
              <View style={[styles.perfBadge, { backgroundColor: perf.bg }]}>
                <MaterialCommunityIcons
                  name={perf.icon}
                  size={12}
                  color={perf.color}
                />
                <Text style={[styles.perfText, { color: perf.color }]}>
                  {perf.label}
                </Text>
              </View>
            )}
          </View>

          {/* Session code */}
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.outline, marginBottom: 8 }}
            numberOfLines={1}
          >
            {session.name}
          </Text>

          {/* Stats chips */}
          <View style={styles.statsRow}>
            <StatChip
              icon="calendar-outline"
              label={formatSessionDate(session.session_date)}
              theme={theme}
            />
            <StatChip
              icon="clock-outline"
              label={`${durationMin} phút`}
              theme={theme}
            />
            <StatChip
              icon="flag-checkered"
              label={`${session.result_count} mục tiêu`}
              theme={theme}
            />
          </View>
        </View>

        {/* Chevron */}
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={theme.colors.outline}
        />
      </View>
    </TouchableOpacity>
  );
}

function StatChip({
  icon,
  label,
  theme,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  theme: MD3Theme;
}) {
  return (
    <View
      style={[
        styles.statChip,
        { backgroundColor: theme.colors.surfaceVariant },
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={12}
        color={theme.colors.onSurfaceVariant}
      />
      <Text
        style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
      >
        {label}
      </Text>
    </View>
  );
}

/** Format "2026-04-07" → "07/04/2026" */
function formatSessionDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  infoBlock: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
    flexWrap: "wrap",
  },
  studentName: {
    fontWeight: "700",
    flex: 1,
  },
  perfBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  perfText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
});
