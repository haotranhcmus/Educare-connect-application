import React, { useRef } from "react";
import { Animated, Pressable, View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AvatarLabel } from "@components/common/AvatarLabel";
import { StatusBadge } from "@components/common/StatusBadge";
import { formatDate } from "@utils/formatters";
import { useAuthStore } from "@store/authStore";
import type { ReportListItem } from "@t";

interface ReportListCardProps {
  report: ReportListItem;
  onPress: () => void;
}

const STATUS_ACCENT: Record<string, string> = {
  draft: "#9E9E9E",
  ready: "#1976D2",
  sent: "#1976D2",
  read: "#2E7D32",
};

function ReportListCardImpl({ report, onPress }: ReportListCardProps) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const role = useAuthStore((s) => s.role);
  const isTeacher = role === "teacher";

  const studentFullName = Array.isArray(report.student_id)
    ? report.student_id[1]
    : "";
  const avatarName = studentFullName.replace(/^\[.*?\]\s*/, "") || studentFullName;
  // Show nickname as card title for teachers
  const studentName =
    isTeacher && report.student_nickname
      ? report.student_nickname
      : avatarName;
  const accentColor = STATUS_ACCENT[report.status] || "#9E9E9E";

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.975,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();

  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
            transform: [{ scale }],
          },
        ]}
      >
        {/* Left accent strip by status */}
        <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />

        <View style={styles.body}>
          {/* Top: Avatar + name block + Status */}
          <View style={styles.topRow}>
            <AvatarLabel
              uri={report.student_avatar_url}
              name={avatarName}
              size={36}
            />
            <View style={styles.nameBlock}>
              <Text
                style={[styles.studentName, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {studentName}
              </Text>
              <Text
                style={[styles.reportCode, { color: theme.colors.outline }]}
                numberOfLines={1}
              >
                {report.name}
              </Text>
            </View>
            <StatusBadge status={report.status} size="small" />
          </View>

          {/* Divider */}
          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />

          {/* Meta: date + summary */}
          <View style={styles.metaRow}>
            <MaterialCommunityIcons
              name="calendar-outline"
              size={12}
              color={theme.colors.outline}
            />
            <Text style={[styles.dateText, { color: theme.colors.outline }]}>
              {formatDate(report.report_date)}
            </Text>
            {report.activity_summary ? (
              <>
                <Text style={[styles.dot, { color: theme.colors.outlineVariant }]}>
                  {"·"}
                </Text>
                <Text
                  style={[
                    styles.summaryText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                  numberOfLines={1}
                >
                  {report.activity_summary}
                </Text>
              </>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export const ReportListCard = React.memo(ReportListCardImpl);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  accentStrip: {
    width: 3,
  },
  body: {
    flex: 1,
    paddingHorizontal: 13,
    paddingVertical: 12,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nameBlock: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  reportCode: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: -1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dateText: {
    fontSize: 11,
    fontWeight: "600",
  },
  dot: {
    fontSize: 11,
    fontWeight: "400",
  },
  summaryText: {
    fontSize: 11,
    fontWeight: "400",
    flex: 1,
  },
});
