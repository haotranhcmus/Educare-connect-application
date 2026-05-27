import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text, ProgressBar, Divider, useTheme } from "react-native-paper";

const TREND_MAP: Record<string, { icon: string; label: string }> = {
  improving: { icon: "↑", label: "Tốt hơn" },
  stable: { icon: "→", label: "Ổn định" },
  declining: { icon: "↓", label: "Cần cải thiện" },
  stagnant: { icon: "⟳", label: "Chưa thay đổi" },
  insufficient_data: { icon: "—", label: "Chưa đủ dữ liệu" },
};

function getAccuracyBadge(current: number, target: number, status: string) {
  if (status === "mastered") return { icon: "⭐", color: "#F57C00" };
  if (current >= target) return { icon: "✅", color: "#2E7D32" };
  if (current >= 50) return { icon: "🔵", color: "#1976D2" };
  return { icon: "🟡", color: "#F9A825" };
}

interface ParentGoalCardProps {
  goal: any;
  isExpanded: boolean;
  onToggle: () => void;
}

function ParentGoalCardImpl({
  goal,
  isExpanded,
  onToggle,
}: ParentGoalCardProps) {
  const theme = useTheme();
  const domainName = Array.isArray(goal.goal_domain_id)
    ? goal.goal_domain_id[1]
    : "";

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <Text variant="titleSmall">{domainName}</Text>
      <Text variant="bodyMedium" numberOfLines={isExpanded ? undefined : 1}>
        {goal.name}
      </Text>

      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}
      >
        <ProgressBar
          progress={(goal.progress_pct || 0) / 100}
          color={theme.colors.primary}
          style={{ flex: 1, height: 8, borderRadius: 4 }}
        />
        <Text variant="bodySmall" style={{ marginLeft: 8 }}>
          {Math.round(goal.progress_pct || 0)}%
        </Text>
      </View>

      <Text variant="bodySmall" style={{ color: "#757575", marginTop: 4 }}>
        🟢 Active · {goal.objective_count || 0} mục tiêu ngắn hạn
      </Text>

      <Text variant="bodySmall" style={{ textAlign: "right", opacity: 0.5 }}>
        {isExpanded ? "⌃" : "⌄"}
      </Text>

      {/* Expanded objectives */}
      {isExpanded && goal.objectives && (
        <View style={{ marginTop: 12 }}>
          <Divider style={{ marginBottom: 8 }} />
          <Text
            variant="bodySmall"
            style={{ fontWeight: "600", marginBottom: 8 }}
          >
            Mục tiêu ngắn hạn:
          </Text>
          {goal.objectives.map((obj: any, idx: number) => {
            const badge = getAccuracyBadge(
              obj.current_accuracy_pct,
              obj.target_accuracy_pct,
              obj.status,
            );
            const trend = TREND_MAP[obj.trend] || TREND_MAP.insufficient_data;

            return (
              <View key={obj.id} style={styles.objBlock}>
                <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
                  {idx + 1}. {obj.name}
                </Text>
                {obj.description && (
                  <Text
                    variant="bodySmall"
                    numberOfLines={2}
                    style={{ color: "#757575", marginTop: 2 }}
                  >
                    Mô tả: {obj.description}
                  </Text>
                )}
                <Text variant="bodySmall" style={{ marginTop: 4 }}>
                  Xuất phát: {obj.baseline_accuracy_pct}%
                </Text>
                <Text variant="bodySmall">
                  Hiện tại: {obj.current_accuracy_pct}% Mục tiêu:{" "}
                  {obj.target_accuracy_pct}%
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 4,
                  }}
                >
                  <ProgressBar
                    progress={
                      obj.target_accuracy_pct > 0
                        ? obj.current_accuracy_pct / obj.target_accuracy_pct
                        : 0
                    }
                    color={badge.color}
                    style={{ flex: 1, height: 6, borderRadius: 3 }}
                  />
                  <Text variant="bodySmall" style={{ marginLeft: 8 }}>
                    {obj.current_accuracy_pct}/{obj.target_accuracy_pct}
                  </Text>
                </View>

                <Text variant="bodySmall" style={{ marginTop: 4 }}>
                  {badge.icon} Đang thực hiện {trend.icon} {trend.label}
                </Text>

                {obj.last_session_date && (
                  <Text
                    variant="bodySmall"
                    style={{ color: "#757575", marginTop: 2 }}
                  >
                    Buổi gần nhất: {obj.last_session_date}
                    {obj.last_session_accuracy != null
                      ? `  ·  Kết quả: ${obj.last_session_accuracy}%`
                      : ""}
                  </Text>
                )}
                <Divider style={{ marginTop: 8 }} />
              </View>
            );
          })}
        </View>
      )}
    </TouchableOpacity>
  );
}

export const ParentGoalCard = React.memo(ParentGoalCardImpl);

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  objBlock: { marginBottom: 12 },
});
