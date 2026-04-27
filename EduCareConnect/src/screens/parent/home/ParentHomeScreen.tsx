import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Text, useTheme, type MD3Theme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import { formatFloatTime } from "../../../utils/formatters";

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

  // Auto-select first child on first load
  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudent(students[0]);
    }
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

  return (
    <>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* ── Welcome Banner ─────────────────────────────────── */}
        <View
          style={[
            styles.banner,
            {
              backgroundColor: theme.colors.primary,
              paddingTop: insets.top + 16,
            },
          ]}
        >
          <View style={styles.bannerRow}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: "rgba(255,255,255,0.25)" },
              ]}
            >
              <MaterialCommunityIcons name="account" size={26} color="#fff" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.bannerGreeting}>Xin chào,</Text>
              <Text style={styles.bannerName} numberOfLines={1}>
                {userName || "Phụ huynh"}
              </Text>
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.notifBtn}
                onPress={() => navigation.navigate("ReportTab")}
              >
                <MaterialCommunityIcons name="bell" size={20} color="#fff" />
                <View style={styles.notifDot}>
                  <Text style={styles.notifCount}>{unreadCount}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Selected Child Card ─────────────────────────────── */}
        {selectedStudent && (
          <View
            style={[
              styles.childCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.childCardTop}>
              <AvatarLabel
                uri={
                  selectedStudent.avatar
                    ? `data:image/png;base64,${selectedStudent.avatar}`
                    : undefined
                }
                name={selectedStudent.name}
                size={50}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.nameRow}>
                  <Text
                    variant="titleSmall"
                    style={{
                      color: theme.colors.onSurface,
                      fontWeight: "700",
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {selectedStudent.name}
                  </Text>
                  {students.length > 1 && (
                    <TouchableOpacity
                      style={[
                        styles.selectBtn,
                        { backgroundColor: theme.colors.primaryContainer },
                      ]}
                      onPress={() => setSelectorOpen(true)}
                    >
                      <MaterialCommunityIcons
                        name="swap-horizontal"
                        size={14}
                        color={theme.colors.primary}
                      />
                      <Text
                        variant="labelSmall"
                        style={{ color: theme.colors.primary, marginLeft: 4 }}
                      >
                        Chọn con
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={{ marginTop: 6 }}>
                  <StatusBadge status={selectedStudent.status} />
                </View>
                {teacherName && (
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons
                      name="account-tie-outline"
                      size={12}
                      color={theme.colors.outline}
                    />
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.outline, marginLeft: 4 }}
                      numberOfLines={1}
                    >
                      {teacherName}
                    </Text>
                  </View>
                )}
                {centerName && (
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons
                      name="home-city-outline"
                      size={12}
                      color={theme.colors.outline}
                    />
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.outline, marginLeft: 4 }}
                      numberOfLines={1}
                    >
                      {centerName}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* ── Stats Row ─────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard
            icon="calendar-check-outline"
            iconColor={theme.colors.primary}
            iconBg={theme.colors.primaryContainer}
            label="Buổi tuần này"
            value={String(sessionsThisWeek)}
            theme={theme}
          />
          <StatCard
            icon="bell-badge-outline"
            iconColor="#E65100"
            iconBg="#FFF3E0"
            label="Chưa đọc"
            value={String(unreadCount)}
            theme={theme}
          />
        </View>

        {/* ── Latest Session ──────────────────────────────────── */}
        {latestSession && (
          <View
            style={[styles.section, { backgroundColor: theme.colors.surface }]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.iconBox, { backgroundColor: "#E8F5E9" }]}>
                <MaterialCommunityIcons
                  name="calendar-check"
                  size={18}
                  color="#2E7D32"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  variant="titleSmall"
                  style={{ color: theme.colors.onSurface, fontWeight: "700" }}
                >
                  Buổi học gần nhất
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.outline }}
                >
                  {formatSessionDate(latestSession.session_date)} ·{" "}
                  {formatFloatTime(latestSession.start_time)} –{" "}
                  {formatFloatTime(latestSession.end_time)}
                  {latestSession.location
                    ? ` · ${LOCATION_LABELS[latestSession.location] ?? latestSession.location}`
                    : ""}
                </Text>
              </View>
              <View style={styles.doneBadge}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={13}
                  color="#2E7D32"
                />
                <Text style={styles.doneText}>Xong</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Child Selector Modal */}
      <ChildSelectorModal
        visible={selectorOpen}
        onClose={() => setSelectorOpen(false)}
      />
    </>
  );
}
// ── StatCard helper ────────────────────────────────────────────────────

function StatCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  theme,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  theme: any;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={iconColor}
        />
      </View>
      <Text
        variant="headlineSmall"
        style={{ color: iconColor, fontWeight: "800", lineHeight: 30 }}
      >
        {value}
      </Text>
      <Text
        variant="labelSmall"
        style={{ color: theme.colors.outline, textAlign: "center" }}
      >
        {label}
      </Text>
    </View>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

const LOCATION_LABELS: Record<string, string> = {
  center: "Tại trung tâm",
  home: "Tại nhà",
  online: "Trực tuyến",
};

function formatSessionDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${days[d.getDay()]} ${dd}/${mm}`;
}

// ── Styles ───────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { paddingBottom: 40 },

  // Banner
  banner: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  bannerRow: { flexDirection: "row", alignItems: "center" },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerGreeting: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
  bannerName: { color: "#fff", fontSize: 17, fontWeight: "700" },
  notifBtn: { position: "relative", padding: 6 },
  notifDot: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#FF5252",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notifCount: { color: "#fff", fontSize: 10, fontWeight: "700" },

  // Child card
  childCard: {
    marginHorizontal: 16,
    marginTop: -14,
    borderRadius: 16,
    elevation: 4,
    overflow: "hidden",
  },
  childCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
    flexShrink: 0,
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 14,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    elevation: 1,
    gap: 2,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  // Sections
  section: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    padding: 16,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  seeMoreBtn: { flexDirection: "row", alignItems: "center" },

  // Done badge
  doneBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  doneText: { fontSize: 11, color: "#2E7D32", fontWeight: "600" },
});
