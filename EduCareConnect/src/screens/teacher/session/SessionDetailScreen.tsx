import React from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { Text, Button, Divider, useTheme } from "react-native-paper";
import { AvatarLabel } from "../../../components/common/AvatarLabel";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { SectionHeader } from "../../../components/common/SectionHeader";
import { ResultSummaryCard } from "../../../components/session/ResultSummaryCard";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import {
  useSessionDetail,
  useSessionResults,
} from "../../../hooks/useSessions";
import { formatDate, formatFloatTime } from "../../../utils/formatters";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SessionStackParamList } from "../../../navigation/types";
import { SessionResult } from "@/src/types/models";

type Props = NativeStackScreenProps<SessionStackParamList, "SessionDetail">;

const OBSERVATION_LABELS: Record<string, Record<string, string>> = {
  attendance: { present: "Có mặt", absent: "Vắng", late: "Đến muộn" },
  mood: {
    very_good: "Rất tốt",
    good: "Tốt",
    neutral: "Bình thường",
    difficult: "Khó khăn",
    very_difficult: "Rất khó khăn",
  },
  energy_level: { high: "Cao", normal: "Bình thường", low: "Thấp" },
  engagement_level: {
    highly_engaged: "Rất tập trung",
    engaged: "Tham gia",
    partially_engaged: "Tham gia một phần",
    disengaged: "Không tham gia",
  },
  overall_performance: {
    excellent: "Xuất sắc",
    good: "Tốt",
    fair: "Bình thường",
    poor: "Kém",
  },
};

export function SessionDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const theme = useTheme();
  const { data: session, isLoading, refetch } = useSessionDetail(sessionId);
  const { data: results = [] } = useSessionResults(
    session?.status === "done" ? sessionId : 0,
  );

  if (isLoading && !session) return <LoadingOverlay visible />;
  if (!session) return null;

  const studentName = Array.isArray(session.student_id)
    ? session.student_id[1]
    : "";
  const isDone = session.status === "done";
  const canEval =
    session.status === "scheduled" || session.status === "completed";
  const canEdit = session.status === "draft" || session.status === "scheduled";
  const duration = Math.round((session.end_time - session.start_time) * 60);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="titleMedium" style={{ fontWeight: "700" }}>
          {session.name}
        </Text>
        <StatusBadge status={session.status} />
      </View>

      {/* Info section */}
      <SectionHeader icon="information-outline" title="Thông Tin Buổi Học" />
      <View
        style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}
      >
        <AvatarLabel name={studentName} size={40} />
        <Text variant="bodyMedium" style={{ fontWeight: "600", marginTop: 8 }}>
          {studentName}
        </Text>
        <Divider style={{ marginVertical: 8 }} />
        <InfoRow label="Ngày" value={formatDate(session.session_date)} />
        <InfoRow
          label="Thời gian"
          value={`${formatFloatTime(session.start_time)} – ${formatFloatTime(session.end_time)} (${duration} phút)`}
        />
        <InfoRow label="Địa điểm" value={session.location} />
        <InfoRow label="Loại" value={session.session_type} />
        <InfoRow label="Mục đích" value={session.session_purpose} />

        {isDone && (
          <>
            <Divider style={{ marginVertical: 8 }} />
            <InfoRow
              label="Điểm danh"
              value={
                OBSERVATION_LABELS.attendance[session.attendance ?? ""] || ""
              }
            />
            <InfoRow
              label="Tâm trạng"
              value={OBSERVATION_LABELS.mood[session.mood ?? ""] || ""}
            />
            <InfoRow
              label="Năng lượng"
              value={
                OBSERVATION_LABELS.energy_level[session.energy_level ?? ""] ||
                ""
              }
            />
            <InfoRow
              label="Tập trung"
              value={
                OBSERVATION_LABELS.engagement_level[
                  session.engagement_level ?? ""
                ] || ""
              }
            />
            <InfoRow
              label="Kết quả tổng"
              value={
                OBSERVATION_LABELS.overall_performance[
                  session.overall_performance ?? ""
                ] || ""
              }
            />
          </>
        )}
      </View>

      {/* Results section (done) */}
      {isDone && results.length > 0 && (
        <>
          <SectionHeader
            icon="chart-bar"
            title={`Kết Quả Đánh Giá (${results.length})`}
          />
          <View
            style={[
              styles.avgCard,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Text variant="bodyMedium">
              Trung bình: {Math.round(session.avg_accuracy || 0)}% ·{" "}
              {results.length} mục tiêu
            </Text>
          </View>
          {results.map((r: SessionResult) => (
            <ResultSummaryCard key={r.id} result={r} />
          ))}
          <Button
            mode="outlined"
            icon="magnify"
            onPress={() => navigation.navigate("EvalDetailView", { sessionId })}
            style={{ marginTop: 8 }}
          >
            Xem chi tiết đánh giá
          </Button>
        </>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        {canEval && (
          <Button
            mode="contained"
            icon="clipboard-edit-outline"
            onPress={() => navigation.navigate("EvalStep1", { sessionId })}
          >
            {session.status === "completed"
              ? "Tiếp tục nhập kết quả"
              : "Nhập kết quả buổi học"}
          </Button>
        )}
        {canEdit && (
          <Button
            mode="outlined"
            icon="pencil"
            onPress={() => navigation.navigate("SessionEdit", { sessionId })}
            style={{ marginTop: 8 }}
          >
            Chỉnh sửa
          </Button>
        )}
        {isDone && (
          <Button
            mode="contained"
            icon="file-document-edit-outline"
            onPress={() => {
              navigation.getParent()?.navigate("ReportTab" as any, {
                screen: "ReportCreate",
                params: { sessionId },
              });
            }}
            style={{ marginTop: 8 }}
          >
            Tạo báo cáo buổi học
          </Button>
        )}
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <Text
        variant="labelSmall"
        style={{ color: theme.colors.outline, width: 100 }}
      >
        {label}
      </Text>
      <Text variant="bodySmall">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 1,
  },
  infoCard: { padding: 16, borderRadius: 12, elevation: 1, marginBottom: 16 },
  infoRow: { flexDirection: "row", marginVertical: 2 },
  avgCard: { padding: 12, borderRadius: 10, marginBottom: 8 },
  actions: { marginTop: 24 },
});
