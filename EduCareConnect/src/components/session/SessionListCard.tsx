import React, { useRef } from "react";
import { Animated, Pressable, View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useAuthStore } from "@store/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AvatarLabel } from "@components/common/AvatarLabel";
import { StatusBadge } from "@components/common/StatusBadge";
import { formatFloatTime } from "@utils/formatters";
import {
  SESSION_PURPOSE_LABELS,
  SESSION_TYPE_SHORT_LABELS,
  LOCATION_LABELS,
} from "@utils/labels";
import type { SessionListItem } from "@t";
import { STATUS_COLORS } from "@theme/statusColors";
import { NO_REPORT_BADGE } from "@theme/decorativeColors";

interface SessionListCardProps {
  session: SessionListItem;
  onPress: () => void;
  /** true = has report, false = no report (shows badge), undefined = unknown */
  hasReport?: boolean;
}

// Icon mapping for each meta dimension
const PURPOSE_ICON = "flag-outline";
const TYPE_ICON = "account-group-outline";
const LOCATION_ICON = "map-marker-outline";

type MetaTag = { icon: string; label: string };

function SessionListCardImpl({
  session,
  onPress,
  hasReport,
}: SessionListCardProps) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const role = useAuthStore((s) => s.role);
  const isTeacher = role === "teacher";

  const studentFullName =
    session.student_name ||
    (Array.isArray(session.student_id) ? session.student_id[1] : "");
  const studentName =
    isTeacher && session.student_nickname
      ? session.student_nickname
      : studentFullName;

  const accentColor =
    STATUS_COLORS[session.status]?.color || theme.colors.primary;

  const showNoReport = session.status === "done" && hasReport === false;

  const metaTags: MetaTag[] = [
    {
      icon: PURPOSE_ICON,
      label:
        SESSION_PURPOSE_LABELS[session.session_purpose] ||
        session.session_purpose,
    },
    {
      icon: TYPE_ICON,
      label:
        SESSION_TYPE_SHORT_LABELS[session.session_type] || session.session_type,
    },
    {
      icon: LOCATION_ICON,
      label: LOCATION_LABELS[session.location] || session.location,
    },
  ].filter((t) => Boolean(t.label));

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
        <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />

        <View style={styles.body}>
          {/* Time + Status */}
          <View style={styles.headerRow}>
            <Text style={[styles.timeText, { color: theme.colors.onSurface }]}>
              {formatFloatTime(session.start_time)}
              <Text style={[styles.timeSep, { color: theme.colors.outline }]}>
                {" – "}
              </Text>
              {formatFloatTime(session.end_time)}
            </Text>
            <StatusBadge status={session.status} size="small" />
          </View>

          {/* Avatar + Student */}
          <View style={styles.studentRow}>
            <View
              style={[styles.avatarRing, { borderColor: `${accentColor}30` }]}
            >
              <AvatarLabel
                uri={session.student_avatar_url}
                name={studentName}
                size={28}
              />
            </View>
            <View style={styles.studentInfo}>
              <Text
                style={[styles.studentName, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {studentName}
              </Text>

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

            {showNoReport && (
              <View style={styles.noReportBadge}>
                <MaterialCommunityIcons
                  name="file-alert-outline"
                  size={10}
                  color={NO_REPORT_BADGE.color}
                />
                <Text style={styles.noReportText}>Chưa báo cáo</Text>
              </View>
            )}
          </View>

          {session.status === "done" && (session.result_count || 0) > 0 && (
            <View style={styles.resultRow}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={11}
                color={theme.colors.primary}
              />
              <Text
                style={[styles.resultText, { color: theme.colors.primary }]}
              >
                {session.result_count} mục tiêu đã đánh giá
              </Text>
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
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  accentStrip: { width: 3 },
  body: { flex: 1, paddingHorizontal: 13, paddingVertical: 12, gap: 8 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeText: { fontSize: 15, fontWeight: "700", letterSpacing: -0.3 },
  timeSep: { fontWeight: "400" },
  studentRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatarRing: { borderRadius: 18, borderWidth: 1.5, overflow: "hidden" },
  studentInfo: { flex: 1, gap: 4 },
  studentName: { fontSize: 13, fontWeight: "600", letterSpacing: 0.1 },
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
  resultRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  resultText: { fontSize: 11, fontWeight: "600" },
});
