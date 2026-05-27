import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Divider, useTheme, Chip } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MEASUREMENT_TYPE_LABELS } from "@utils/labels";
import type { IepObjectiveListItem } from "@t";

interface ObjectiveDetailCardProps {
  objective: IepObjectiveListItem;
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.detailRow}>
      <MaterialCommunityIcons
        name={icon}
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

function ObjectiveDetailCardImpl({ objective }: ObjectiveDetailCardProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const domains = Array.isArray(objective.domain_ids)
    ? (objective.domain_ids as unknown[]).filter(Boolean)
    : [];

  return (
    <TouchableOpacity
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.objectiveCard,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.objectiveHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
              {objective.objective_code}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ fontWeight: "600", marginTop: 2 }}
            >
              {objective.name}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            {/* <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {expanded ? "Ẩn chi tiết" : "Xem chi tiết"}
            </Text> */}
            <MaterialCommunityIcons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </View>
        </View>

        {domains.length > 0 && (
          <View style={styles.chipRow}>
            {domains.map((d, idx) => {
              const tuple = Array.isArray(d) ? d : null;
              const obj =
                !tuple && typeof d === "object" && d !== null
                  ? (d as { id?: number; name?: string })
                  : null;
              const key = tuple ? tuple[0] : (obj?.id ?? idx);
              const label = tuple
                ? tuple[1]
                : (obj?.name ?? String(obj?.id ?? d));
              return (
                <Chip
                  key={key}
                  compact
                  style={{ marginRight: 4, marginTop: 4 }}
                  textStyle={{ fontSize: 11 }}
                >
                  {label}
                </Chip>
              );
            })}
          </View>
        )}

        {objective.description ? (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}
            numberOfLines={expanded ? undefined : 2}
          >
            {objective.description}
          </Text>
        ) : null}

        {expanded && (
          <>
            <Divider style={{ marginVertical: 8 }} />
            {objective.measurement_type ? (
              <DetailRow
                icon="ruler"
                label="Cách thu thập & đánh giá"
                value={
                  MEASUREMENT_TYPE_LABELS[objective.measurement_type] ||
                  objective.measurement_type
                }
              />
            ) : null}
            {objective.implementation_steps ? (
              <DetailRow
                icon="format-list-checks"
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
            {objective.smart_specific ? (
              <DetailRow
                icon="target"
                label="Cụ thể (S)"
                value={objective.smart_specific}
              />
            ) : null}
            {objective.smart_measurable ? (
              <DetailRow
                icon="chart-line"
                label="Đo lường (M)"
                value={objective.smart_measurable}
              />
            ) : null}
            {objective.smart_analysis ? (
              <DetailRow
                icon="check-decagram-outline"
                label="Khả thi (A/R)"
                value={objective.smart_analysis}
              />
            ) : null}
            {objective.smart_timebound ? (
              <DetailRow
                icon="clock-outline"
                label="Thời hạn (T)"
                value={objective.smart_timebound}
              />
            ) : null}
            {Array.isArray(objective.difficulty_id) ? (
              <DetailRow
                icon="alert-circle-outline"
                label="Độ khó"
                value={objective.difficulty_id[1] ?? ""}
              />
            ) : null}
            {objective.suggested_prompt_level_id &&
            Array.isArray(objective.suggested_prompt_level_id) ? (
              <DetailRow
                icon="account-question-outline"
                label="Mức gợi ý"
                value={objective.suggested_prompt_level_id[1] ?? ""}
              />
            ) : null}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

export const ObjectiveDetailCard = React.memo(ObjectiveDetailCardImpl);

const styles = StyleSheet.create({
  objectiveCard: {
    padding: 14,
    borderRadius: 12,
    elevation: 1,
    marginBottom: 10,
  },
  objectiveHeader: { flexDirection: "row", alignItems: "flex-start" },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 4,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },
});
