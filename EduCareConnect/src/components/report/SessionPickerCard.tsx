import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text, Divider, useTheme } from "react-native-paper";
import { AvatarLabel } from "../common/AvatarLabel";
import { StatusBadge } from "../common/StatusBadge";
import { formatFloatTime } from "../../utils/formatters";

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

const PERF_MAP: Record<string, { label: string; icon: string; color: string }> =
  {
    excellent: { label: "Xuất sắc", icon: "⭐", color: "#F57C00" },
    good: { label: "Tốt", icon: "👍", color: "#2E7D32" },
    average: { label: "Trung bình", icon: "😐", color: "#757575" },
    needs_support: { label: "Cần hỗ trợ", icon: "🔴", color: "#D32F2F" },
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
      <AvatarLabel name={studentName} />
      <Text
        variant="labelSmall"
        style={{ color: theme.colors.outline, marginBottom: 4 }}
      >
        {session.name}
      </Text>
      <Divider style={{ marginVertical: 8 }} />
      <Text variant="bodyMedium">
        📅 {formatSessionDate(session.session_date)}
      </Text>
      <Text variant="bodyMedium">
        ⏱ {durationMin} phút · 🎯 {session.result_count} mục tiêu
      </Text>
      {perf && (
        <Text variant="bodyMedium" style={{ color: perf.color, marginTop: 4 }}>
          {perf.icon} {perf.label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

/** Format "2026-04-07" → "Thứ Hai, 07/04/2026" */
function formatSessionDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const days = [
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
  return `${days[d.getDay()]}, ${dd}/${mm}/${d.getFullYear()}`;
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
  },
});
