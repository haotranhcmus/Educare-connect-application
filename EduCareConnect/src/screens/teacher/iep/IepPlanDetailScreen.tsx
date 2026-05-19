import React, { useState, useLayoutEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Platform,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text, useTheme, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  cacheDirectory,
  writeAsStringAsync,
  EncodingType,
} from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { SectionHeader } from "../../../components/common/SectionHeader";
import { GoalCard } from "../../../components/iep/GoalCard";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { useIepPlanDetail, useGoalsForPlan } from "../../../hooks/useIep";
import { ODOO_BASE_URL, client } from "../../../api/odooClient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import IepPlaceholder from "../../../../assets/placeholder/iep-placeholder.svg";
import { formatDate } from "../../../utils/formatters";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK) {
    parts.push(
      String.fromCharCode(
        ...(bytes.subarray(i, i + CHUNK) as unknown as number[]),
      ),
    );
  }
  return btoa(parts.join(""));
}

function safeFilename(s: string): string {
  return s
    .replace(/[/\\:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60);
}

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
          {avgAccuracy > 0 && (
            <MetaChip
              icon="percent"
              label={`TB ${Math.round(avgAccuracy)}%`}
              accent
            />
          )}
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

// ── IepPlanDetailScreen ───────────────────────────────────────
export function IepPlanDetailScreen({ route, navigation }: any) {
  const { planId, objectiveRouteName = "IepObjectiveDetail" } =
    route.params as {
      planId: number;
      studentName?: string;
      objectiveRouteName?: string;
    };
  const theme = useTheme();
  const [expandedGoalId, setExpandedGoalId] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  const {
    data: plan,
    isLoading: planLoading,
    refetch,
  } = useIepPlanDetail(planId);
  const { data: goals = [], isLoading: goalsLoading } = useGoalsForPlan(planId);

  const isLoading = planLoading || goalsLoading;

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const reportUrl = `${ODOO_BASE_URL}/report/pdf/educare_iep.report_educare_iep_plan_document/${planId}`;

      // Use the shared axios client so the session cookie interceptor fires
      const response = await client.get<ArrayBuffer>(reportUrl, {
        responseType: "arraybuffer",
      });

      if (response.status !== 200) {
        throw new Error(`Lỗi server (${response.status}). Vui lòng thử lại.`);
      }

      // Verify the server returned a real PDF, not an HTML error page
      const magic = new Uint8Array(response.data).slice(0, 4);
      if (String.fromCharCode(...magic) !== "%PDF") {
        throw new Error("Server không trả về PDF. Vui lòng đăng nhập lại.");
      }

      const studentName = Array.isArray(plan?.student_id)
        ? plan.student_id[1]
        : "";
      const period = plan?.iep_period ?? "";
      const filename = `Ke_Hoach_IEP_${safeFilename(studentName)}_${safeFilename(period)}.pdf`;

      const base64 = arrayBufferToBase64(response.data);
      const localUri = `${cacheDirectory}${filename}`;
      await writeAsStringAsync(localUri, base64, {
        encoding: EncodingType.Base64,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(localUri, {
          mimeType: "application/pdf",
          dialogTitle: `Kế hoạch IEP — ${studentName}`,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Thông báo", "Thiết bị không hỗ trợ chia sẻ file.");
      }
    } catch (e: any) {
      Alert.alert("Lỗi tải file", e?.message || "Không thể tải kế hoạch IEP.");
    } finally {
      setDownloading(false);
    }
  }, [planId, downloading, plan]);

  // Download icon in navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        downloading ? (
          <ActivityIndicator
            size="small"
            color="#fff"
            style={{ marginRight: 14 }}
          />
        ) : (
          <IconButton
            icon="download-outline"
            size={22}
            iconColor="#fff"
            onPress={handleDownload}
          />
        ),
    });
  }, [navigation, downloading, handleDownload]);

  if (isLoading && !plan) return <LoadingOverlay visible />;
  if (!plan) return null;

  const teacherName = Array.isArray(plan.assigned_teacher_id)
    ? plan.assigned_teacher_id[1]
    : "";
  const supervisorName = Array.isArray(plan.supervisor_id)
    ? plan.supervisor_id[1]
    : "";

  const handleObjectivePress = (objectiveId: number) => {
    navigation.navigate(objectiveRouteName, { objectiveId });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={screenStyles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
    >
      {/* ── Plan header card ── */}
      <View
        style={[
          screenStyles.planCard,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        {/* Gradient banner */}
        <LinearGradient
          colors={[G1, G2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={screenStyles.planGradHeader}
        >
          <View style={screenStyles.planIconBubble}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={20}
              color="#fff"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={screenStyles.planTitle} numberOfLines={2}>
              {plan.iep_period}
            </Text>
          </View>
          <StatusBadge status={plan.status} />
        </LinearGradient>

        {/* Meta rows */}
        <View style={screenStyles.planMeta}>
          {(plan.start_date || plan.end_date) && (
            <View style={screenStyles.planMetaRow}>
              <MaterialCommunityIcons
                name="calendar-range"
                size={15}
                color={G1}
              />
              <Text
                variant="bodySmall"
                style={[
                  screenStyles.planMetaText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {formatDate(plan.start_date)} – {formatDate(plan.end_date)}
              </Text>
            </View>
          )}
          {teacherName ? (
            <View style={screenStyles.planMetaRow}>
              <MaterialCommunityIcons
                name="account-tie-outline"
                size={15}
                color={G1}
              />
              <Text
                variant="bodySmall"
                style={[
                  screenStyles.planMetaText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {teacherName}
              </Text>
            </View>
          ) : null}
          {supervisorName ? (
            <View style={screenStyles.planMetaRow}>
              <MaterialCommunityIcons
                name="account-supervisor-outline"
                size={15}
                color={G1}
              />
              <Text
                variant="bodySmall"
                style={[
                  screenStyles.planMetaText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {supervisorName}
              </Text>
            </View>
          ) : null}
          <View style={screenStyles.planMetaRow}>
            <MaterialCommunityIcons name="tag-outline" size={15} color={G1} />
            <Text
              variant="bodySmall"
              style={[
                screenStyles.planMetaText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Phiên bản {plan.version_number}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Goals ── */}
      <SectionHeader
        icon="bullseye-arrow"
        title={`Mục tiêu dài hạn (${goals.length})`}
      />

      {goals.length === 0 ? (
        <View style={screenStyles.emptyWrap}>
          <IepPlaceholder width={140} height={140} />
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}
          >
            Chưa có mục tiêu nào
          </Text>
        </View>
      ) : (
        goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            expanded={expandedGoalId === goal.id}
            onToggle={() =>
              setExpandedGoalId((prev) => (prev === goal.id ? null : goal.id))
            }
            onObjectivePress={handleObjectivePress}
          />
        ))
      )}
    </ScrollView>
  );
}

const screenStyles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },

  // ── Plan header card ─────────────────────────────────────────
  planCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        // shadowColor: G1,
        // shadowOffset: { width: 0, height: 4 },
        // shadowOpacity: 0.15,
        // shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  planGradHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  planIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  planLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 20,
  },
  planMeta: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  planMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  planMetaText: {
    flex: 1,
    fontSize: 13,
  },

  // ── Empty state ──────────────────────────────────────────────
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 40,
  },
});
