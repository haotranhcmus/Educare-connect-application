import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, useTheme, Divider } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBadge } from "../common/StatusBadge";
import { ProgressBar } from "../common/ProgressBar";
import { TrendChip } from "../common/TrendChip";
import type { IepObjectiveListItem } from "../../types";
import { formatDate } from "../../utils/formatters";

interface ObjectiveCardProps {
  objective: IepObjectiveListItem;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: number) => void;
  onPress?: (id: number) => void;
}

export function ObjectiveCard({
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

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.background,
          borderColor: selected
            ? theme.colors.primary
            : theme.colors.outlineVariant,
          borderWidth: selectable ? 1.5 : 0,
        },
      ]}
    >
      {/* Main row — tap to select/navigate */}
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {selectable && (
              <MaterialCommunityIcons
                name={selected ? "checkbox-marked" : "checkbox-blank-outline"}
                size={20}
                color={selected ? theme.colors.primary : theme.colors.outline}
                style={{ marginRight: 8 }}
              />
            )}
            <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
              {objective.objective_code}:
            </Text>
          </View>
          <StatusBadge status={objective.status} size="small" />
        </View>

        <Text
          variant="bodySmall"
          numberOfLines={expanded ? undefined : 2}
          style={{ marginVertical: 4 }}
        >
          {objective.name}
        </Text>

        {/* Accuracy row */}
        <View style={styles.accuracyRow}>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            Mức ban đầu: {objective.baseline_accuracy_pct}%
          </Text>
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurface, fontWeight: "600" }}
          >
            Hiện tại: {Math.round(objective.current_accuracy_pct || 0)}%
          </Text>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            Mục tiêu: {objective.target_accuracy_pct}%
          </Text>
        </View>

        <View style={styles.footer}>
          {objective.trend && (
            <TrendChip trend={objective.trend} size="small" />
          )}
          {objective.last_session_date && (
            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
              Gần nhất: {formatDate(objective.last_session_date)}
            </Text>
          )}
          {!selectable && (
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={theme.colors.outline}
            />
          )}
        </View>
      </TouchableOpacity>

      {/* Expand toggle — only in selectable mode when detail exists */}
      {hasDetail && (
        <>
          <Divider style={{ marginTop: 8 }} />
          <TouchableOpacity
            style={styles.expandRow}
            onPress={() => setExpanded((v) => !v)}
            activeOpacity={0.6}
          >
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.primary, flex: 1 }}
            >
              {expanded ? "Ẩn chi tiết" : "Xem chi tiết mục tiêu"}
            </Text>
            <MaterialCommunityIcons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          {expanded && (
            <View style={styles.detailSection}>
              {/* Progress bar — only shown in detail view */}
              <View style={{ marginBottom: 4 }}>
                <ProgressBar
                  progress={objective.progress_pct || 0}
                  size="small"
                  label="Tiến độ hoàn thành"
                />
                {/* <Text
                  variant="labelSmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginTop: 1,
                    fontStyle: "italic",
                  }}
                >
                  (Độ chính xác hiện tại:{" "}
                  {Math.round(objective.current_accuracy_pct || 0)}% · Mục tiêu:{" "}
                  {Math.round(objective.target_accuracy_pct || 0)}%)
                </Text> */}
              </View>
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
              {objective.consecutive_sessions_required ? (
                <DetailRow
                  icon="calendar-check-outline"
                  label="Buổi đạt liên tiếp"
                  value={`${objective.consecutive_sessions_achieved || 0}/${objective.consecutive_sessions_required} buổi`}
                />
              ) : null}
            </View>
          )}
        </>
      )}
    </View>
  );
}

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
        style={{ marginRight: 6, marginTop: 2 }}
      />
      <View style={{ flex: 1 }}>
        <Text
          variant="labelSmall"
          style={{ color: theme.colors.outline, marginBottom: 1 }}
        >
          {label}
        </Text>
        <Text variant="bodySmall">{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 10, borderRadius: 10, marginBottom: 8 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  accuracyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  expandRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 2,
  },
  detailSection: { paddingTop: 8, gap: 10 },
  detailRow: { flexDirection: "row", alignItems: "flex-start" },
});
