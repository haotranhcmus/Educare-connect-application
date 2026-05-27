import React, { useRef } from "react";
import { Animated, Pressable, View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBadge } from "@components/common/StatusBadge";
import { formatFloatTime } from "@utils/formatters";
import { SESSION_PURPOSE_LABELS, LOCATION_LABELS } from "@utils/labels";
import { NO_REPORT_BADGE } from "@theme/decorativeColors";
import { STATUS_COLORS } from "@theme/statusColors";
import { useAuthStore } from "@store/authStore";
import type { SessionListItem } from "@t";

interface SessionListCardProps {
  session: SessionListItem;
  onPress: (sessionId: number) => void;
  compact?: boolean;
  /** Pass true if a report already exists for this session; false shows the warning badge */
  hasReport?: boolean;
}

type MetaTag = { icon: string; label: string };

function SessionListCardImpl({
  session,
  onPress,
  compact = false,
  hasReport,
}: SessionListCardProps) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const role = useAuthStore((s) => s.role);
  const isTeacher = role === "teacher";

  const studentFullName = Array.isArray(session.student_id)
    ? session.student_id[1]
    : "";
  const studentName =
    isTeacher && session.student_nickname
      ? session.student_nickname
      : studentFullName;

  const accentColor =
    STATUS_COLORS[session.status]?.color || theme.colors.primary;

  const showNoReportBadge = session.status === "done" && hasReport === false;

  const metaTags: MetaTag[] = compact
    ? []
    : [
        {
          icon: "flag-outline",
          label:
            SESSION_PURPOSE_LABELS[session.session_purpose] ||
            session.session_purpose,
        },
        {
          icon: "map-marker-outline",
          label: LOCATION_LABELS[session.location] || session.location,
        },
      ].filter((t) => Boolean(t.label));

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 50, bounciness: 0 }).start();

  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start();

  return (
    <Pressable
      onPress={() => onPress(session.id)}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
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
        <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />

        <View style={styles.body}>
          {/* Time + right cluster */}
          <View style={styles.headerRow}>
            <Text style={[styles.timeText, { color: theme.colors.onSurface }]}>
              {formatFloatTime(session.start_time)}
              <Text style={{ color: theme.colors.outline, fontWeight: "400" }}>
                {" – "}
              </Text>
              {formatFloatTime(session.end_time)}
            </Text>
            <View style={styles.rightRow}>
              {showNoReportBadge && (
                <View style={styles.noReportBadge}>
                  <MaterialCommunityIcons
                    name="file-alert-outline"
                    size={10}
                    color={NO_REPORT_BADGE.color}
                  />
                  <Text style={styles.noReportText}>Chưa có báo cáo</Text>
                </View>
              )}
              <StatusBadge status={session.status} size="small" />
            </View>
          </View>

          {studentName ? (
            <Text
              style={[styles.studentName, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {studentName}
            </Text>
          ) : null}

          {/* Icon chips — tinted with status accent for clear scanability */}
          {metaTags.length > 0 && (
            <View style={styles.tagRow}>
              {metaTags.map((tag) => (
                <View
                  key={tag.icon + tag.label}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: `${accentColor}14`,
                      borderColor: `${accentColor}35`,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={tag.icon as any}
                    size={11}
                    color={accentColor}
                  />
                  <Text style={[styles.tagLabel, { color: accentColor }]}>
                    {tag.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export const SessionListCard = React.memo(SessionListCardImpl);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  accentStrip: { width: 3 },
  body: { flex: 1, paddingHorizontal: 12, paddingVertical: 11, gap: 5 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeText: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2 },
  rightRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  studentName: { fontSize: 13, fontWeight: "600" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
    borderWidth: 1,
  },
  tagLabel: { fontSize: 10, fontWeight: "600" },
  noReportBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NO_REPORT_BADGE.bg,
    borderWidth: 1,
    borderColor: NO_REPORT_BADGE.border,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  noReportText: {
    fontSize: 9,
    fontWeight: "700",
    color: NO_REPORT_BADGE.color,
  },
});
