import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Text, useTheme, MD3Theme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AvatarLabel } from "../common/AvatarLabel";
import { PERFORMANCE_CONFIG } from "../../theme/decorativeColors";
import { formatDate } from "../../utils/formatters";

interface SessionPickerCardProps {
  session: {
    id: number;
    name: string;
    student_id: [number, string] | false;
    session_date: string;
    duration: number;
    overall_performance?: string | false;
    result_count: number;
    student_avatar_url?: string;
  };
  onSelect: (sessionId: number) => void;
}

const G1 = "#2E7D32";
const G2 = "#43A047";
const G_LIGHT = "#E8F5E9";
const G_TEXT = "#1B5E20";

function SessionPickerCardImpl({
  session,
  onSelect,
}: SessionPickerCardProps) {
  const theme = useTheme();

  const studentName = Array.isArray(session.student_id)
    ? session.student_id[1]
    : "(Không rõ)";

  // Strip "[IEP-DEMO-AN] " style prefix → clean display name
  const displayName = studentName.replace(/^\[.*?\]\s*/, "");

  // Extract the bracket code as a tag
  const codeMatch = studentName.match(/^\[(.*?)\]/);
  const iepTag = codeMatch ? codeMatch[1] : null;

  const durationMin = Math.round(session.duration * 60);
  const perf = session.overall_performance
    ? PERFORMANCE_CONFIG[session.overall_performance]
    : null;

  return (
    <TouchableOpacity
      onPress={() => onSelect(session.id)}
      activeOpacity={0.82}
      style={styles.wrapper}
    >
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        {/* ── Gradient header ───────────────────────────── */}
        <LinearGradient
          colors={[G1, G2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          {/* Avatar */}
          <View style={styles.avatarRing}>
            <AvatarLabel
              uri={session.student_avatar_url}
              name={studentName}
              size={40}
            />
          </View>

          {/* Name + IEP tag */}
          <View style={styles.headerInfo}>
            <Text style={styles.displayName} numberOfLines={1}>
              {displayName}
            </Text>
            {iepTag && (
              <View style={styles.iepTag}>
                <Text style={styles.iepTagText}>{iepTag}</Text>
              </View>
            )}
          </View>

          {/* Performance badge (if any) */}
          {perf && (
            <View
              style={[
                styles.perfBadge,
                { backgroundColor: "rgba(255,255,255,0.22)" },
              ]}
            >
              <MaterialCommunityIcons name={perf.icon} size={12} color="#fff" />
              <Text style={styles.perfText}>{perf.label}</Text>
            </View>
          )}
        </LinearGradient>

        {/* ── Body ─────────────────────────────────────── */}
        <View style={styles.body}>
          {/* Session code row */}
          <View style={styles.codeRow}>
            <MaterialCommunityIcons
              name="identifier"
              size={14}
              color={theme.colors.outline}
            />
            <Text
              style={[styles.sessionCode, { color: theme.colors.outline }]}
              numberOfLines={1}
            >
              {session.name}
            </Text>
          </View>

          {/* Chips */}
          <View style={styles.chipsRow}>
            <Chip
              icon="calendar-outline"
              label={formatDate(session.session_date)}
            />
            <Chip icon="clock-outline" label={`${durationMin} phút`} />
            <Chip
              icon="flag-outline"
              label={`${session.result_count} mục tiêu`}
              variant="purple"
            />
          </View>
        </View>

        {/* ── Footer CTA ────────────────────────────────── */}
        <View
          style={[
            styles.footer,
            { borderTopColor: theme.colors.outlineVariant },
          ]}
        >
          <Text style={[styles.footerLabel, { color: G1 }]}>
            Chọn buổi học này
          </Text>
          <View style={styles.arrowBtn}>
            <MaterialCommunityIcons name="arrow-right" size={16} color={G1} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const SessionPickerCard = React.memo(SessionPickerCardImpl);

function Chip({
  icon,
  label,
  variant = "green",
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  variant?: "green" | "purple";
}) {
  const bg = variant === "purple" ? "#EDE7F6" : G_LIGHT;
  const color = variant === "purple" ? "#4527A0" : G_TEXT;
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <MaterialCommunityIcons name={icon} size={11} color={color} />
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 18,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        // shadowColor: G1,
        // shadowOffset: { width: 0, height: 5 },
        // shadowOpacity: 0.13,
        // shadowRadius: 14,
      },
      android: { elevation: 5 },
    }),
  },

  card: {
    borderRadius: 18,
    overflow: "hidden",
  },

  // ── Header ────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  avatarRing: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    overflow: "hidden",
  },
  headerInfo: {
    flex: 1,
    gap: 3,
  },
  displayName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.2,
  },
  iepTag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  iepTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.4,
  },
  perfBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  perfText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },

  // ── Body ──────────────────────────────────────────────────
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  sessionCode: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // ── Footer ────────────────────────────────────────────────
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: G_LIGHT + "80",
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: G_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
});
