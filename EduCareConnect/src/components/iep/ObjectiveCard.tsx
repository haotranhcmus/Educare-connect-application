import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import { Text, useTheme, Divider, MD3Theme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBadge } from "@components/common/StatusBadge";
import { TrendChip } from "@components/common/TrendChip";
import type { IepObjectiveListItem } from "@t";
import { formatDate } from "@utils/formatters";
import { theme } from "@theme";

interface ObjectiveCardProps {
  objective: IepObjectiveListItem;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: number) => void;
  onPress?: (id: number) => void;
}

function ObjectiveCardImpl({
  objective,
  selectable = false,
  selected = false,
  onSelect,
  onPress,
}: ObjectiveCardProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const handlePress = () => {
    if (selectable && onSelect) {
      onSelect(objective.id);
    } else if (onPress) {
      onPress(objective.id);
    }
  };

  const hasDetail =
    selectable &&
    (objective.description ||
      objective.measurement_method ||
      objective.implementation_steps ||
      objective.materials_needed ||
      objective.consecutive_sessions_required);

  // Progress fill: từ baseline → current trên thang đến target
  const progressPct = objective.progress_pct ?? 0;
  const currentPct = Math.round(objective.current_accuracy_pct ?? 0);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.background,
          borderColor: selected
            ? theme.colors.primary
            : theme.colors.outlineVariant,
          borderWidth: selected ? 2 : 0.75,
        },
      ]}
    >
      {/* ─── Main tappable row ─── */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.75}
        style={styles.cardInner}
      >
        {/* Header: code + checkbox (selectable) + status badge */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {selectable && (
              <MaterialCommunityIcons
                name={selected ? "checkbox-marked" : "checkbox-blank-outline"}
                size={20}
                color={selected ? theme.colors.primary : theme.colors.outline}
                style={{ marginRight: 6 }}
              />
            )}
            <Text
              variant="labelSmall"
              style={[styles.codeLabel, { color: theme.colors.primary }]}
            >
              {objective.objective_code}
            </Text>
          </View>
          <StatusBadge status={objective.status} size="small" />
        </View>

        {/* Objective name */}
        <Text
          variant="bodySmall"
          numberOfLines={expanded ? undefined : 2}
          style={[styles.name, { color: theme.colors.onSurface }]}
        >
          {objective.name}
        </Text>

        {/* ─── Stats row ─── */}
        <View
          style={[styles.statsRow, { backgroundColor: theme.colors.surface }]}
        >
          <StatCell
            value={`${objective.baseline_accuracy_pct}%`}
            label="Ban đầu"
            theme={theme}
          />
          <View
            style={[
              styles.statDivider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
          <StatCell
            value={`${currentPct}%`}
            label="Hiện tại"
            highlight
            theme={theme}
          />
          <View
            style={[
              styles.statDivider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
          <StatCell
            value={`${objective.target_accuracy_pct}%`}
            label="Mục tiêu"
            theme={theme}
          />
        </View>

        {/* ─── Footer: trend + date + chevron ─── */}
        <View style={styles.footer}>
          {objective.trend ? (
            <TrendChip trend={objective.trend} size="small" />
          ) : (
            <View />
          )}
          <View style={styles.footerRight}>
            {objective.last_session_date && (
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.outline }}
              >
                {formatDate(objective.last_session_date)}
              </Text>
            )}
            {!selectable && (
              <MaterialCommunityIcons
                name="chevron-right"
                size={16}
                color={theme.colors.outline}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* ─── Expand toggle — selectable mode only ─── */}
      {hasDetail && (
        <>
          <Divider />
          <TouchableOpacity
            style={styles.expandRow}
            onPress={() => setExpanded((v) => !v)}
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          {expanded && (
            <View style={styles.detailSection}>
              {/* Progress bar */}
              <View style={styles.progressWrap}>
                <View style={styles.progressLabelRow}>
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.outline }}
                  >
                    Tiến độ hoàn thành
                  </Text>
                  <Text
                    variant="labelSmall"
                    style={{
                      color: theme.colors.onSurface,
                      fontWeight: "600",
                    }}
                  >
                    {Math.round(progressPct)}%
                  </Text>
                </View>
                <View
                  style={[
                    styles.progressTrack,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(progressPct, 100)}%` as any,
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Detail rows */}
              {objective.description ? (
                <DetailRow
                  icon="text-box-outline"
                  label="Mô tả mục tiêu"
                  value={objective.description}
                />
              ) : null}
              {objective.measurement_method ? (
                <DetailRow
                  icon="ruler"
                  label="Phương pháp đo lường"
                  value={objective.measurement_method}
                />
              ) : null}
              {objective.implementation_steps ? (
                <DetailRow
                  icon="list-status"
                  label="Các bước thực hiện"
                  value={objective.implementation_steps}
                />
              ) : null}
              {objective.materials_needed ? (
                <DetailRow
                  icon="package-variant-closed"
                  label="Vật liệu cần thiết"
                  value={objective.materials_needed}
                />
              ) : null}

              {/* Consecutive sessions — pill style */}
              {objective.consecutive_sessions_required ? (
                <View
                  style={[
                    styles.consecutivePill,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="calendar-check-outline"
                    size={15}
                    color={theme.colors.primary}
                  />
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.primary, flex: 1 }}
                  >
                    Buổi đạt liên tiếp
                  </Text>
                  <Text
                    variant="labelSmall"
                    style={{
                      color: theme.colors.onSurface,
                      fontWeight: "600",
                    }}
                  >
                    {objective.consecutive_sessions_achieved ?? 0} /{" "}
                    {objective.consecutive_sessions_required} buổi
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </>
      )}
    </View>
  );
}

/* ─── StatCell ─── */
function StatCell({
  value,
  label,
  highlight,
  theme,
}: {
  value: string;
  label: string;
  highlight?: boolean;
  theme: MD3Theme;
}) {
  return (
    <View style={styles.statCell}>
      <Text
        variant="titleSmall"
        style={{
          color: highlight ? theme.colors.primary : theme.colors.onSurface,
          fontWeight: highlight ? "700" : "500",
          fontSize: 15,
        }}
      >
        {value}
      </Text>
      <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
        {label}
      </Text>
    </View>
  );
}

/* ─── DetailRow ─── */
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.detailRow}>
      <MaterialCommunityIcons
        name={icon as any}
        size={15}
        color={theme.colors.primary}
        style={{ marginRight: 8, marginTop: 1 }}
      />
      <View style={{ flex: 1 }}>
        <Text
          variant="labelSmall"
          style={{
            color: theme.colors.outline,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            marginBottom: 2,
            fontSize: 10,
          }}
        >
          {label}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export const ObjectiveCard = React.memo(ObjectiveCardImpl);

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
  },
  cardInner: {
    padding: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  name: {
    lineHeight: 19,
    marginBottom: 10,
    fontSize: 16,
  },
  /* Stats */
  statsRow: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 10,
  },
  statCell: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 2,
  },
  statDivider: {
    width: 0.5,
    alignSelf: "stretch",
  },
  /* Footer */
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  /* Expand */
  expandRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  /* Detail */
  detailSection: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 12,
  },
  progressWrap: {
    gap: 4,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressTrack: {
    height: 5,
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  consecutivePill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 8,
  },
});
