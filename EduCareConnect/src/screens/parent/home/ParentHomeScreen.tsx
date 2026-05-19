import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AvatarLabel } from "../../../components/common/AvatarLabel";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { ChildSelectorModal } from "./ChildSelectorModal";
import {
  useMyStudents,
  useUnreadReportCount,
  useLatestSession,
  useSessionsThisWeek,
} from "../../../hooks/useParent";
import { useParentStore } from "../../../store/parentStore";
import { useAuthStore } from "../../../store/authStore";
import { formatFloatTime, formatDateShort } from "../../../utils/formatters";

const LOCATION_LABELS: Record<string, string> = {
  center: "Tại trung tâm",
  home: "Tại nhà",
  online: "Trực tuyến",
};

const SESSION_STATUS_CFG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  scheduled: { label: "Lên lịch", color: "#1565C0", bg: "#E3F2FD" },
  completed: { label: "Đã học", color: "#2E7D32", bg: "#E8F5E9" },
  done: { label: "Đã học", color: "#2E7D32", bg: "#E8F5E9" },
  cancelled: { label: "Đã huỷ", color: "#C62828", bg: "#FFEBEE" },
  draft: { label: "Nháp", color: "#757575", bg: "#F5F5F5" },
};

const G1 = "#2E7D32";
const G2 = "#43A047";
const G_LIGHT = "#E8F5E9";
const G_TEXT = "#1B5E20";

export function ParentHomeScreen({ navigation }: any) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const userName = useAuthStore((s) => s.userName);
  const { selectedStudent, selectedStudentId, setSelectedStudent } =
    useParentStore();
  const [selectorOpen, setSelectorOpen] = useState(false);

  const {
    data: students = [],
    isLoading,
    refetch,
    isRefetching,
  } = useMyStudents();

  useEffect(() => {
    if (students.length > 0 && !selectedStudentId)
      setSelectedStudent(students[0]);
  }, [students, selectedStudentId, setSelectedStudent]);

  const { data: unreadCount = 0 } = useUnreadReportCount(
    selectedStudentId ?? undefined,
  );
  const { data: latestSession } = useLatestSession(
    selectedStudentId ?? undefined,
  );
  const { data: sessionsThisWeek = 0 } = useSessionsThisWeek(
    selectedStudentId ?? undefined,
  );

  if (isLoading) return <LoadingOverlay visible />;

  const teacherName = Array.isArray(selectedStudent?.assigned_teacher_id)
    ? selectedStudent.assigned_teacher_id[1]
    : null;
  const centerName = Array.isArray(selectedStudent?.center_id)
    ? selectedStudent.center_id[1]
    : null;

  const today = new Date();
  const greeting = (() => {
    const h = today.getHours();
    if (h < 12) return "Chào buổi sáng";
    if (h < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  })();
  const dateStr = today.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });

  const sessionCfg = latestSession
    ? (SESSION_STATUS_CFG[latestSession.status] ?? SESSION_STATUS_CFG.draft)
    : null;

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* ══════════════════════════════════════════════
            TALL GRADIENT HEADER
            — extra bottom padding so child card floats
        ══════════════════════════════════════════════ */}
        <LinearGradient
          colors={[G1, G2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          {/* Greeting row */}
          <View style={styles.headerRow}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons name="account" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.greetLabel}>{greeting},</Text>
              <Text style={styles.greetName} numberOfLines={1}>
                {userName || "Phụ huynh"}
              </Text>
            </View>
            <View style={styles.datePill}>
              <Text style={styles.dateText}>{dateStr}</Text>
            </View>
          </View>

          {/* Stats inside header */}
          <View style={styles.headerStats}>
            <HeaderStat
              icon="calendar-check"
              label="Buổi tuần này"
              value={String(sessionsThisWeek)}
            />
            <View style={styles.headerStatDivider} />
            <HeaderStat
              icon="bell-badge-outline"
              label="Báo cáo chưa đọc"
              value={String(unreadCount)}
              urgent={unreadCount > 0}
            />
          </View>

          {/* Extra bottom space for child card overlap */}
          <View style={{ height: 36 }} />
        </LinearGradient>

        {/* ══════════════════════════════════════════════
            CHILD CARD — floats over header
        ══════════════════════════════════════════════ */}
        {selectedStudent ? (
          <View style={styles.childCardOuter}>
            <View
              style={[
                styles.childCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              {/* Top: avatar + name + status + switch */}
              <View style={styles.childCardTop}>
                <View style={[styles.childAvatarRing, { borderColor: G1 }]}>
                  <AvatarLabel
                    uri={
                      selectedStudent.avatar
                        ? `data:image/png;base64,${selectedStudent.avatar}`
                        : undefined
                    }
                    name={selectedStudent.name}
                    size={48}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={[
                      styles.childName,
                      { color: theme.colors.onSurface },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedStudent.name}
                  </Text>
                  <View style={{ marginTop: 3 }}>
                    <StatusBadge status={selectedStudent.status} size="small" />
                  </View>
                </View>

                {students.length > 1 && (
                  <TouchableOpacity
                    style={[styles.switchBtn, { backgroundColor: G_LIGHT }]}
                    onPress={() => setSelectorOpen(true)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="swap-horizontal"
                      size={14}
                      color={G1}
                    />
                    <Text style={[styles.switchBtnText, { color: G1 }]}>
                      Chọn con
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Divider */}
              <View
                style={[
                  styles.cardDivider,
                  { backgroundColor: theme.colors.outlineVariant },
                ]}
              />

              {/* Bottom: teacher + center chips */}
              <View style={styles.childCardBottom}>
                {teacherName && (
                  <View style={styles.metaChip}>
                    <MaterialCommunityIcons
                      name="account-tie-outline"
                      size={13}
                      color={G1}
                    />
                    <Text
                      style={[styles.metaChipText, { color: G_TEXT }]}
                      numberOfLines={1}
                    >
                      {teacherName}
                    </Text>
                  </View>
                )}
                {centerName && (
                  <View style={styles.metaChip}>
                    <MaterialCommunityIcons
                      name="home-city-outline"
                      size={13}
                      color={G1}
                    />
                    <Text
                      style={[styles.metaChipText, { color: G_TEXT }]}
                      numberOfLines={1}
                    >
                      {centerName}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : null}

        {/* ══════════════════════════════════════════════
            QUICK ACTIONS
        ══════════════════════════════════════════════ */}
        <View style={styles.quickRow}>
          <QuickBtn
            icon="file-document-outline"
            label="Báo cáo"
            iconBg="#E8F5E9"
            iconColor={G1}
            badge={unreadCount > 0 ? String(unreadCount) : undefined}
            onPress={() => navigation.navigate("ReportTab")}
            surface={theme.colors.surface}
          />
          <QuickBtn
            icon="calendar-month-outline"
            label="Thời khóa biểu"
            iconBg="#E3F2FD"
            iconColor="#1565C0"
            onPress={() =>
              navigation.navigate("ChildTab", { screen: "ChildTimetable" })
            }
            surface={theme.colors.surface}
          />
          <QuickBtn
            icon="account-details-outline"
            label="Hồ sơ con"
            iconBg="#F3E5F5"
            iconColor="#6A1B9A"
            onPress={() =>
              navigation.navigate("ChildTab", {
                screen: "ChildDetail",
                params: { studentId: selectedStudentId },
              })
            }
            surface={theme.colors.surface}
          />
        </View>

        {/* ══════════════════════════════════════════════
            LATEST SESSION
        ══════════════════════════════════════════════ */}
        {latestSession && sessionCfg ? (
          <>
            <HomeSectionHeader
              icon="calendar-check-outline"
              title="Buổi học gần nhất"
              theme={theme}
            />
            <View style={styles.sessionCardOuter}>
              <View
                style={[
                  styles.sessionCard,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                {/* Left accent stripe */}
                <View
                  style={[
                    styles.sessionStripe,
                    { backgroundColor: sessionCfg.color },
                  ]}
                />

                <View style={styles.sessionBody}>
                  {/* Time + status */}
                  <View style={styles.sessionTop}>
                    <View style={styles.sessionTimeBlock}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={13}
                        color={sessionCfg.color}
                      />
                      <Text
                        style={[
                          styles.sessionTime,
                          { color: theme.colors.onSurface },
                        ]}
                      >
                        {formatFloatTime(latestSession.start_time)}–
                        {formatFloatTime(latestSession.end_time)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: sessionCfg.bg },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: sessionCfg.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusPillText,
                          { color: sessionCfg.color },
                        ]}
                      >
                        {sessionCfg.label}
                      </Text>
                    </View>
                  </View>

                  {/* Date + location chips */}
                  <View style={styles.sessionMeta}>
                    <View style={styles.sessionChip}>
                      <MaterialCommunityIcons
                        name="calendar-outline"
                        size={11}
                        color={theme.colors.outline}
                      />
                      <Text
                        style={[
                          styles.sessionChipText,
                          { color: theme.colors.outline },
                        ]}
                      >
                        {formatDateShort(latestSession.session_date)}
                      </Text>
                    </View>
                    {latestSession.location ? (
                      <View style={styles.sessionChip}>
                        <MaterialCommunityIcons
                          name="map-marker-outline"
                          size={11}
                          color={theme.colors.outline}
                        />
                        <Text
                          style={[
                            styles.sessionChipText,
                            { color: theme.colors.outline },
                          ]}
                        >
                          {LOCATION_LABELS[latestSession.location] ??
                            latestSession.location}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>

      <ChildSelectorModal
        visible={selectorOpen}
        onClose={() => setSelectorOpen(false)}
      />
    </>
  );
}

// ── Header stat block ─────────────────────────────────────────
function HeaderStat({
  icon,
  label,
  value,
  urgent,
}: {
  icon: string;
  label: string;
  value: string;
  urgent?: boolean;
}) {
  return (
    <View style={styles.headerStatBlock}>
      <View style={styles.headerStatTop}>
        <MaterialCommunityIcons
          name={icon as any}
          size={16}
          color="rgba(255,255,255,0.8)"
        />
        <Text style={styles.headerStatValue}>{value}</Text>
        {urgent && <View style={styles.urgentDot} />}
      </View>
      <Text style={styles.headerStatLabel}>{label}</Text>
    </View>
  );
}

// ── Section header ────────────────────────────────────────────
function HomeSectionHeader({
  icon,
  title,
  theme,
}: {
  icon: string;
  title: string;
  theme: any;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View
        style={[
          styles.sectionIconBox,
          { backgroundColor: theme.colors.primaryContainer },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={15}
          color={theme.colors.primary}
        />
      </View>
      <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        {title}
      </Text>
    </View>
  );
}

// ── Quick action button ───────────────────────────────────────
function QuickBtn({
  icon,
  label,
  iconBg,
  iconColor,
  badge,
  onPress,
  surface,
}: {
  icon: string;
  label: string;
  iconBg: string;
  iconColor: string;
  badge?: string;
  onPress: () => void;
  surface: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.quickBtn, { backgroundColor: surface }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.quickIcon, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={iconColor}
        />
      </View>
      <Text style={[styles.quickLabel, { color: "#1C1B1F" }]}>{label}</Text>
      {badge && (
        <View style={styles.quickBadge}>
          <Text style={styles.quickBadgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { paddingBottom: 40 },

  // ── Header ──────────────────────────────────────────────────
  header: {
    paddingHorizontal: 16,
    paddingBottom: 0, // controlled by inner spacer
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  greetLabel: { color: "rgba(255,255,255,0.78)", fontSize: 11 },
  greetName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  datePill: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dateText: { color: "#fff", fontSize: 11, fontWeight: "500" },

  // Stats inside header
  headerStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 0,
  },
  headerStatBlock: { flex: 1, alignItems: "center", gap: 3 },
  headerStatTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerStatValue: { fontSize: 22, fontWeight: "800", color: "#fff" },
  headerStatLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
  headerStatDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 4,
  },
  urgentDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FF7043",
  },

  // ── Child card ───────────────────────────────────────────────
  childCardOuter: {
    marginHorizontal: 16,
    marginTop: -28, // overlap into header
    marginBottom: 14,
    borderRadius: 18,
    ...Platform.select({
      ios: {
        // shadowColor: G1,
        // shadowOffset: { width: 0, height: 6 },
        // shadowOpacity: 0.14,
        // shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  childCard: {
    borderRadius: 18,
    overflow: "hidden",
  },
  childCardTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  childAvatarRing: {
    borderRadius: 28,
    borderWidth: 2.5,
    overflow: "hidden",
  },
  childName: { fontSize: 15, fontWeight: "800", letterSpacing: 0.1 },
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  switchBtnText: { fontSize: 12, fontWeight: "700" },
  cardDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  childCardBottom: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: G_LIGHT,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  metaChipText: { fontSize: 12, fontWeight: "600" },

  // ── Quick actions ────────────────────────────────────────────
  quickRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  quickBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    ...Platform.select({
      ios: {
        // shadowColor: "#000",
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.06,
        // shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
    position: "relative",
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 7,
    textAlign: "center",
  },
  quickBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#E65100",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  quickBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  // ── Section header ───────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
  },
  sectionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 14, fontWeight: "800", letterSpacing: 0.1 },

  // ── Latest session ───────────────────────────────────────────
  sessionCardOuter: {
    marginHorizontal: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        // shadowColor: "#000",
        // shadowOffset: { width: 0, height: 3 },
        // shadowOpacity: 0.07,
        // shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  sessionCard: {
    borderRadius: 16,
    flexDirection: "row",
    overflow: "hidden",
  },
  sessionStripe: { width: 4 },
  sessionBody: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  sessionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sessionTimeBlock: { flexDirection: "row", alignItems: "center", gap: 5 },
  sessionTime: { fontSize: 16, fontWeight: "800" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: "700" },
  sessionMeta: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  sessionChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  sessionChipText: { fontSize: 12, fontWeight: "500" },
});
