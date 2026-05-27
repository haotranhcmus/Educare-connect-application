import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const G1 = "#2E7D32";
const G2 = "#43A047";
const G_LIGHT = "#E8F5E9";
const G_TEXT = "#1B5E20";

interface Objective {
  name: string;
  accuracy: number;
}

interface SessionInfoCardProps {
  studentName: string;
  reportDate: string;
  durationMinutes: number;
  performance: string | null;
  objectives: Objective[];
  avgAccuracy: number;
}

export function SessionInfoCard({
  studentName,
  reportDate,
  durationMinutes,
  performance,
  objectives,
  avgAccuracy,
}: SessionInfoCardProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        {/* ── Gradient header ─────────────────────── */}
        <LinearGradient
          colors={[G1, G2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={22}
              color="#fff"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>Học sinh</Text>
            <Text style={styles.headerName} numberOfLines={1}>
              {studentName}
            </Text>
          </View>
          {performance && (
            <View style={styles.perfPill}>
              <MaterialCommunityIcons
                name="star-outline"
                size={11}
                color="#fff"
              />
              <Text style={styles.perfText}>{performance}</Text>
            </View>
          )}
        </LinearGradient>

        {/* ── Meta row ────────────────────────────── */}
        <View style={styles.metaRow}>
          <MetaChip icon="calendar-outline" label={reportDate} />
          <MetaChip icon="clock-outline" label={`${durationMinutes} phút`} />
        </View>

        {/* ── Objectives ──────────────────────────── */}
        {objectives.length > 0 && (
          <>
            <View
              style={[
                styles.divider,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />
            <View style={styles.objectivesSection}>
              <View style={styles.objTitleRow}>
                <MaterialCommunityIcons name="target" size={14} color={G1} />
                <Text style={[styles.objTitle, { color: G_TEXT }]}>
                  Mục tiêu đã thực hành
                </Text>
              </View>
              <View style={styles.objectivesContainer}>
                {objectives.map((obj, i) => (
                  <ObjectiveItem
                    key={i}
                    name={obj.name}
                    accuracy={obj.accuracy}
                    theme={theme}
                  />
                ))}
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

// ── Meta chip ─────────────────────────────────────────────────
function MetaChip({
  icon,
  label,
  accent = false,
}: {
  icon: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.metaChip, { backgroundColor: accent ? G1 : G_LIGHT }]}>
      <MaterialCommunityIcons
        name={icon as any}
        size={12}
        color={accent ? "#fff" : G_TEXT}
      />
      <Text style={[styles.metaChipText, { color: accent ? "#fff" : G_TEXT }]}>
        {label}
      </Text>
    </View>
  );
}

// ── Objective item ────────────────────────────────────────────
function ObjectiveItem({
  name,
  accuracy,
  theme,
}: {
  name: string;
  accuracy: number;
  theme: any;
}) {
  const acc = Math.round(accuracy);
  const progress = accuracy / 100;

  let barColor = theme.colors.error;
  if (accuracy >= 80) barColor = G1;
  else if (accuracy >= 50) barColor = "#E67E22";

  const barBg =
    accuracy >= 80 ? G_LIGHT : accuracy >= 50 ? "#FFF3E0" : "#FFEBEE";

  return (
    <View style={styles.objectiveItem}>
      <View style={styles.objectiveHeader}>
        <Text
          style={[styles.objectiveName, { color: theme.colors.onSurface }]}
          numberOfLines={2}
        >
          {name}
        </Text>
        <View style={[styles.accBadge, { backgroundColor: `${barColor}18` }]}>
          <Text style={[styles.accText, { color: barColor }]}>{acc}%</Text>
        </View>
      </View>

      {/* Custom progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: barBg }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(100, acc)}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        // shadowColor: G1,
        // shadowOffset: { width: 0, height: 4 },
        // shadowOpacity: 0.12,
        // shadowRadius: 12,
      },
      android: { elevation: 5 },
    }),
  },

  card: {
    borderRadius: 16,
    overflow: "hidden",
  },

  // ── Header ────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.1,
  },
  perfPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  perfText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },

  // ── Meta row ──────────────────────────────────────────────
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "space-between",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Divider ───────────────────────────────────────────────
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },

  // ── Objectives ────────────────────────────────────────────
  objectivesSection: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  objTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  objTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  objectivesContainer: {
    gap: 12,
  },
  objectiveItem: {
    gap: 6,
  },
  objectiveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  objectiveName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  accBadge: {
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  accText: {
    fontSize: 12,
    fontWeight: "800",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
});
