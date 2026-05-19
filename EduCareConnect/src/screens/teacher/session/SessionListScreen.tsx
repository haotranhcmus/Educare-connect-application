import React, {
  useState,
  useMemo,
  useCallback,
  useLayoutEffect,
  useEffect,
} from "react";
import {
  View,
  SectionList,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import {
  Searchbar,
  Chip,
  Text,
  FAB,
  useTheme,
  Button,
  IconButton,
  Badge,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { SessionListCard } from "../../../components/session/SessionListCard";
import { EmptyState } from "../../../components/common/EmptyState";
import SessionPlaceholder from "../../../../assets/placeholder/session-placeholder.svg";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { MiniCalendar } from "../../../components/common/MiniCalendar";
import { useMySessions } from "../../../hooks/useSessions";
import { useSessionsForReport } from "../../../hooks/useReports";
import { formatDate } from "../../../utils/formatters";
import { groupByDate } from "../../../utils/groupByDate";
import { logger } from "../../../utils/logger";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SessionStackParamList } from "../../../navigation/types";
import type { SessionListItem } from "../../../types";
import { theme as appTheme } from "@/src/theme/theme";

type Props = NativeStackScreenProps<SessionStackParamList, "SessionList">;

const DATE_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "today", label: "Hôm nay" },
  { key: "week", label: "Tuần này" },
  { key: "month", label: "Tháng này" },
];

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "scheduled", label: "Lên lịch" },
  { key: "done", label: "Đã dạy" },
  { key: "cancelled", label: "Đã hủy" },
];

function getDateRange(key: string) {
  if (key === "all") return {};
  const now = new Date();
  const dateFrom = new Date(now);
  if (key === "week") {
    const day = now.getDay();
    dateFrom.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  } else if (key === "month") {
    dateFrom.setDate(1);
  }
  return {
    dateFrom: dateFrom.toISOString().split("T")[0],
    dateTo: now.toISOString().split("T")[0],
  };
}

// Header search styles defined outside component to avoid recreation
const headerSearchStyle = {
  backgroundColor: "rgba(255,255,255,0.18)",
  elevation: 0,
  height: 40,
  borderRadius: 10,
};
const headerSearchInputStyle = {
  color: "#fff",
  fontSize: 13,
  paddingLeft: 0,
};
const headerBadgeStyle = {
  position: "absolute" as const,
  top: 4,
  right: 4,
  backgroundColor: "#E65100",
};

const ACTIVE_CHIP_TEXT_STYLE = {
  color: "#1B5E20",
  fontWeight: "600" as const,
  fontSize: 12,
  lineHeight: 16,
  includeFontPadding: false, // Android: tắt extra padding mặc định quanh text
};

// ─── Main Screen ────────────────────────────────────────────────────────────

export function SessionListScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterNoReport, setFilterNoReport] = useState(
    route.params?.filterNoReport ?? false,
  );
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Pending state inside the filter modal
  const [pendingDateFilter, setPendingDateFilter] = useState("all");
  const [pendingStatusFilter, setPendingStatusFilter] = useState("all");
  const [pendingFilterNoReport, setPendingFilterNoReport] = useState(false);

  // Re-apply when navigated here with filterNoReport param (e.g. from HomeScreen)
  useEffect(() => {
    if (route.params?.filterNoReport) {
      setFilterNoReport(true);
    }
  }, [route.params?.filterNoReport]);

  const filters = useMemo(() => getDateRange(dateFilter), [dateFilter]);
  const {
    data: sessions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useMySessions(filters);

  const { data: noReportSessions = [] } = useSessionsForReport();
  const noReportIds = useMemo(
    () => new Set(noReportSessions.map((s) => s.id)),
    [noReportSessions],
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (dateFilter !== "all") n++;
    if (statusFilter !== "all") n++;
    if (filterNoReport) n++;
    return n;
  }, [dateFilter, statusFilter, filterNoReport]);

  const toggleView = useCallback(() => {
    setViewMode((v) => (v === "list" ? "calendar" : "list"));
    setSelectedDate("");
  }, []);

  const openFilterModal = useCallback(() => {
    setPendingDateFilter(dateFilter);
    setPendingStatusFilter(statusFilter);
    setPendingFilterNoReport(filterNoReport);
    setShowFilterModal(true);
  }, [dateFilter, statusFilter, filterNoReport]);

  // Search + filter + calendar toggle all live in the navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Searchbar
          placeholder="Tìm theo tên học sinh"
          value={search}
          onChangeText={setSearch}
          style={headerSearchStyle}
          inputStyle={headerSearchInputStyle}
          iconColor="rgba(255,255,255,0.75)"
          placeholderTextColor="rgba(255,255,255,0.55)"
        />
      ),
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View>
            <IconButton
              icon="filter-variant"
              size={22}
              iconColor={activeFilterCount > 0 ? "#A5D6A7" : "#fff"}
              onPress={openFilterModal}
            />
            {activeFilterCount > 0 && (
              <Badge style={headerBadgeStyle} size={14}>
                {activeFilterCount}
              </Badge>
            )}
          </View>
          <IconButton
            icon={viewMode === "list" ? "calendar-month-outline" : "format-list-bulleted"}
            size={22}
            iconColor="#fff"
            onPress={toggleView}
          />
        </View>
      ),
    });
  }, [navigation, search, viewMode, activeFilterCount, openFilterModal, toggleView]);

  if (isError) {
    const errorMsg =
      (error as any)?.message || "Không thể tải danh sách buổi học.";
    logger.error("SessionListScreen", "render error state", {
      errorMsg,
      odooError: (error as any)?.odooError,
    });
  }

  const sessionDates = useMemo(
    () => new Set(sessions.map((s: SessionListItem) => s.session_date)),
    [sessions],
  );

  const filtered = useMemo(() => {
    let list = sessions as SessionListItem[];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => {
        const name = Array.isArray(s.student_id) ? s.student_id[1] : "";
        return (
          name.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q)
        );
      });
    }
    if (filterNoReport) {
      list = list.filter((s) => noReportIds.has(s.id));
    }
    if (statusFilter !== "all") {
      list = list.filter((s) => s.status === statusFilter);
    }
    if (viewMode === "calendar" && selectedDate) {
      list = list.filter((s) => s.session_date === selectedDate);
    }
    return list;
  }, [
    sessions,
    search,
    filterNoReport,
    statusFilter,
    viewMode,
    selectedDate,
    noReportIds,
  ]);

  const sections = useMemo(
    () => groupByDate(filtered, (s) => s.session_date),
    [filtered],
  );

  const handleSessionPress = useCallback(
    (sessionId: number) => navigation.navigate("SessionDetail", { sessionId }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: SessionListItem }) => (
      <SessionListCard
        session={item}
        onPress={() => handleSessionPress(item.id)}
        hasReport={!noReportIds.has(item.id)}
      />
    ),
    [handleSessionPress, noReportIds],
  );

  const keyExtractor = useCallback(
    (item: SessionListItem) => String(item.id),
    [],
  );

  const applyFilters = () => {
    setDateFilter(pendingDateFilter);
    setStatusFilter(pendingStatusFilter);
    setFilterNoReport(pendingFilterNoReport);
    setShowFilterModal(false);
  };

  const resetPending = () => {
    setPendingDateFilter("all");
    setPendingStatusFilter("all");
    setPendingFilterNoReport(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* ── Active filter summary ──────────────────────────────── */}
      {activeFilterCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeFilterRow}
          style={styles.activeFilterScroll}
        >
          {dateFilter !== "all" && (
            <Chip
              compact
              onClose={() => setDateFilter("all")}
              style={styles.activeChip}
              textStyle={ACTIVE_CHIP_TEXT_STYLE}
            >
              {DATE_FILTERS.find((f) => f.key === dateFilter)?.label}
            </Chip>
          )}
          {statusFilter !== "all" && (
            <Chip
              compact
              onClose={() => setStatusFilter("all")}
              style={styles.activeChip}
              textStyle={ACTIVE_CHIP_TEXT_STYLE}
            >
              {STATUS_FILTERS.find((f) => f.key === statusFilter)?.label}
            </Chip>
          )}
          {filterNoReport && (
            <Chip
              compact
              onClose={() => setFilterNoReport(false)}
              style={styles.activeChip}
              textStyle={ACTIVE_CHIP_TEXT_STYLE}
            >
              Chưa báo cáo
            </Chip>
          )}
        </ScrollView>
      )}

      {isLoading ? (
        <LoadingOverlay visible={isLoading} />
      ) : isError ? (
        /* ── Error State ─────────────────────────────────────── */
        <View style={styles.errorContainer}>
          <Text
            variant="titleSmall"
            style={{
              color: theme.colors.error,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Không tải được danh sách buổi học
          </Text>
          <Text
            variant="bodySmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
              marginBottom: 16,
              paddingHorizontal: 24,
            }}
          >
            {(error as any)?.message || "Lỗi kết nối hoặc quyền truy cập."}
          </Text>
          <Button mode="contained" onPress={() => refetch()} icon="refresh">
            Thử lại
          </Button>
        </View>
      ) : viewMode === "calendar" ? (
        /* ── Calendar View ───────────────────────────────────── */
        <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
          <MiniCalendar
            month={calMonth}
            sessionDates={sessionDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onPrevMonth={() => setCalMonth((m) => m.subtract(1, "month"))}
            onNextMonth={() => setCalMonth((m) => m.add(1, "month"))}
          />
          {selectedDate ? (
            <>
              <Text
                variant="labelMedium"
                style={[
                  styles.sectionHeader,
                  { color: theme.colors.outline, paddingHorizontal: 16 },
                ]}
              >
                {formatDate(selectedDate)}
              </Text>
              {sections.length === 0 ? (
                <EmptyState
                  image={SessionPlaceholder}
                  title="Không có buổi học ngày này"
                />
              ) : (
                sections.flatMap((sec) =>
                  sec.data.map((item) => (
                    <View key={item.id} style={{ paddingHorizontal: 16 }}>
                      <SessionListCard
                        session={item}
                        onPress={() =>
                          navigation.navigate("SessionDetail", {
                            sessionId: item.id,
                          })
                        }
                        hasReport={!noReportIds.has(item.id)}
                      />
                    </View>
                  )),
                )
              )}
            </>
          ) : (
            <EmptyState
              icon="gesture-tap"
              title="Chọn một ngày để xem buổi học"
            />
          )}
        </ScrollView>
      ) : (
        /* ── List View ───────────────────────────────────────── */
        <SectionList
          style={styles.sectionList}
          sections={sections}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.sectionListContent}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} />
          }
          renderSectionHeader={({ section }) => (
            <Text
              variant="labelMedium"
              style={[styles.sectionHeader, { color: theme.colors.outline }]}
            >
              {formatDate(section.title)}
            </Text>
          )}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState image={SessionPlaceholder} title="Không có buổi học" />
          }
        />
      )}

      <FAB
        icon="plus"
        label="Tạo mới"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => navigation.navigate("SessionCreate", {})}
      />

      {/* ── Filter bottom sheet ───────────────────────────────── */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowFilterModal(false)}
        >
          <Pressable
            onPress={() => {}}
            style={[
              styles.filterSheet,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.filterHeader}>
              <Text variant="titleMedium" style={{ fontWeight: "700" }}>
                Bộ lọc
              </Text>
              <Button onPress={resetPending} compact>
                Đặt lại
              </Button>
            </View>

            <Text
              variant="labelSmall"
              style={[
                styles.filterSectionLabel,
                { color: theme.colors.outline },
              ]}
            >
              KHOẢNG THỜI GIAN
            </Text>
            <View style={styles.chipRow}>
              {DATE_FILTERS.map((f) => (
                <Chip
                  key={f.key}
                  selected={pendingDateFilter === f.key}
                  onPress={() => setPendingDateFilter(f.key)}
                  style={[
                    styles.chip,
                    pendingDateFilter === f.key && {
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                  showSelectedCheck={false}
                  textStyle={
                    pendingDateFilter === f.key
                      ? { color: theme.colors.onPrimary }
                      : undefined
                  }
                >
                  {f.label}
                </Chip>
              ))}
            </View>

            <Text
              variant="labelSmall"
              style={[
                styles.filterSectionLabel,
                { color: theme.colors.outline },
              ]}
            >
              TRẠNG THÁI
            </Text>
            <View style={styles.chipRow}>
              {STATUS_FILTERS.map((f) => (
                <Chip
                  key={f.key}
                  selected={pendingStatusFilter === f.key}
                  onPress={() => setPendingStatusFilter(f.key)}
                  style={[
                    styles.chip,
                    pendingStatusFilter === f.key && {
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                  showSelectedCheck={false}
                  textStyle={
                    pendingStatusFilter === f.key
                      ? { color: theme.colors.onPrimary }
                      : undefined
                  }
                >
                  {f.label}
                </Chip>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.noReportRow,
                {
                  backgroundColor: pendingFilterNoReport
                    ? "#F0FBF1"
                    : theme.colors.surfaceVariant,
                },
              ]}
              onPress={() => setPendingFilterNoReport((v) => !v)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={
                  pendingFilterNoReport
                    ? "checkbox-marked"
                    : "checkbox-blank-outline"
                }
                size={24}
                color={pendingFilterNoReport ? "#2E7D32" : theme.colors.outline}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
                  Chưa có báo cáo
                </Text>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.outline, marginTop: 1 }}
                >
                  Chỉ hiện buổi học chưa gửi báo cáo cho phụ huynh
                </Text>
              </View>
            </TouchableOpacity>

            <Button
              mode="contained"
              onPress={applyFilters}
              style={styles.applyBtn}
              contentStyle={{ paddingVertical: 4 }}
            >
              Áp dụng
            </Button>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // ScrollView wrapper: không cho nó stretch theo flex
  activeFilterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  // contentContainer của ScrollView horizontal
  activeFilterRow: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  activeChip: {
    backgroundColor: "#E8F5E9",
    borderColor: "#2E7D32",
    borderWidth: 1.5,
    borderRadius: 20,
    // Không set height cứng — để chip tự size theo content
    // Không set alignSelf — để alignItems của parent (center) điều khiển
  },
  sectionHeader: { paddingVertical: 8, fontWeight: "600" },
  fab: { position: "absolute", right: 16, bottom: 16, borderRadius: 16 },
  chip: {
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: appTheme.colors.surface,
    borderColor: appTheme.colors.outline,
    borderWidth: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  // SectionList cần flex: 1 để fill hết không gian còn lại
  sectionList: {
    flex: 1,
  },
  sectionListContent: {
    padding: 16,
    paddingBottom: 80,
    // flexGrow: 1 đảm bảo EmptyState được center khi không có items
    flexGrow: 1,
  },
  // Filter modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  filterSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    elevation: 8,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ddd",
    marginBottom: 16,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filterSectionLabel: {
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  noReportRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
  },
  applyBtn: {
    marginTop: 4,
    borderRadius: 12,
  },
});
