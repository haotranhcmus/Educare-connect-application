import React, {
  useState,
  useMemo,
  useCallback,
  useLayoutEffect,
} from "react";
import {
  View,
  SectionList,
  StyleSheet,
  RefreshControl,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import {
  Searchbar,
  Chip,
  FAB,
  Text,
  useTheme,
  IconButton,
  Button,
  Badge,
  Divider,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ReportListCard } from "../../../components/report/ReportListCard";
import { EmptyState } from "../../../components/common/EmptyState";
import ReportPlaceholder from "../../../../assets/placeholder/report-placeholder.svg";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { DatePickerField } from "../../../components/form/DatePickerField";
import { useMyReports } from "../../../hooks/useReports";
import { formatDate } from "../../../utils/formatters";
import { groupByDate } from "../../../utils/groupByDate";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ReportStackParamList } from "../../../navigation/types";
import type { ReportListItem } from "../../../types";
import dayjs from "dayjs";

type Props = NativeStackScreenProps<ReportStackParamList, "ReportList">;

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "draft", label: "Nháp" },
  { key: "sent", label: "Đã gửi" },
  { key: "read", label: "PH đã đọc" },
];

const DATE_PRESETS = [
  { key: "all", label: "Tất cả" },
  { key: "today", label: "Hôm nay" },
  { key: "week", label: "Tuần này" },
  { key: "month", label: "Tháng này" },
  { key: "lastMonth", label: "Tháng trước" },
  { key: "custom", label: "Tùy chỉnh" },
];

function getPresetRange(key: string): { from: string | null; to: string | null } {
  const today = dayjs();
  if (key === "today") {
    const d = today.format("YYYY-MM-DD");
    return { from: d, to: d };
  }
  if (key === "week") {
    return {
      from: today.startOf("week").format("YYYY-MM-DD"),
      to: today.format("YYYY-MM-DD"),
    };
  }
  if (key === "month") {
    return {
      from: today.startOf("month").format("YYYY-MM-DD"),
      to: today.format("YYYY-MM-DD"),
    };
  }
  if (key === "lastMonth") {
    const lm = today.subtract(1, "month");
    return {
      from: lm.startOf("month").format("YYYY-MM-DD"),
      to: lm.endOf("month").format("YYYY-MM-DD"),
    };
  }
  return { from: null, to: null };
}

const headerSearchStyle = {
  backgroundColor: "rgba(255,255,255,0.18)",
  elevation: 0,
  height: 40,
  borderRadius: 10,
};
const headerSearchInputStyle = { color: "#fff", fontSize: 13, paddingLeft: 0 };
const headerBadgeStyle = {
  position: "absolute" as const,
  top: 4,
  right: 4,
  backgroundColor: "#E65100",
};
const CHIP_TEXT_ACTIVE = {
  color: "#1B5E20",
  fontWeight: "600" as const,
  fontSize: 12,
};

export function ReportListScreen({ navigation }: Props) {
  const theme = useTheme();
  const [search, setSearch] = useState("");

  // Applied filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [datePreset, setDatePreset] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [showFilterModal, setShowFilterModal] = useState(false);

  // Pending (inside modal before apply)
  const [pendingStatus, setPendingStatus] = useState("all");
  const [pendingDatePreset, setPendingDatePreset] = useState("all");
  const [pendingCustomFrom, setPendingCustomFrom] = useState("");
  const [pendingCustomTo, setPendingCustomTo] = useState("");

  const { data: reports = [], isLoading, refetch } = useMyReports();

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (statusFilter !== "all") n++;
    if (datePreset !== "all") n++;
    return n;
  }, [statusFilter, datePreset]);

  const openFilter = useCallback(() => {
    setPendingStatus(statusFilter);
    setPendingDatePreset(datePreset);
    setPendingCustomFrom(customFrom);
    setPendingCustomTo(customTo);
    setShowFilterModal(true);
  }, [statusFilter, datePreset, customFrom, customTo]);

  const applyFilters = () => {
    setStatusFilter(pendingStatus);
    setDatePreset(pendingDatePreset);
    setCustomFrom(pendingCustomFrom);
    setCustomTo(pendingCustomTo);
    setShowFilterModal(false);
  };

  const resetPending = () => {
    setPendingStatus("all");
    setPendingDatePreset("all");
    setPendingCustomFrom("");
    setPendingCustomTo("");
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Searchbar
          placeholder="Tìm theo tên học sinh..."
          value={search}
          onChangeText={setSearch}
          style={headerSearchStyle}
          inputStyle={headerSearchInputStyle}
          iconColor="rgba(255,255,255,0.75)"
          placeholderTextColor="rgba(255,255,255,0.55)"
        />
      ),
      headerRight: () => (
        <View>
          <IconButton
            icon="filter-variant"
            size={22}
            iconColor={activeFilterCount > 0 ? "#A5D6A7" : "#fff"}
            onPress={openFilter}
          />
          {activeFilterCount > 0 && (
            <Badge style={headerBadgeStyle} size={14}>
              {activeFilterCount}
            </Badge>
          )}
        </View>
      ),
    });
  }, [navigation, search, activeFilterCount, openFilter]);

  const { from: dateFrom, to: dateTo } = useMemo(() => {
    if (datePreset === "custom") {
      return { from: customFrom || null, to: customTo || null };
    }
    return getPresetRange(datePreset);
  }, [datePreset, customFrom, customTo]);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const name = Array.isArray(r.student_id) ? r.student_id[1] : "";
      const matchSearch =
        !search || name.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" || r.status === statusFilter;
      const matchDate =
        (!dateFrom || r.report_date >= dateFrom) &&
        (!dateTo || r.report_date <= dateTo);
      return matchSearch && matchStatus && matchDate;
    });
  }, [reports, search, statusFilter, dateFrom, dateTo]);

  const sections = useMemo(
    () => groupByDate(filtered, (r) => r.report_date),
    [filtered],
  );

  const handleReportPress = useCallback(
    (reportId: number) => navigation.navigate("ReportDetail", { reportId }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: ReportListItem }) => (
      <ReportListCard
        report={item}
        onPress={() => handleReportPress(item.id)}
      />
    ),
    [handleReportPress],
  );

  const keyExtractor = useCallback(
    (item: ReportListItem) => String(item.id),
    [],
  );

  // Active filter label for custom date preset
  const dateFilterLabel = useMemo(() => {
    if (datePreset === "custom") {
      if (customFrom && customTo)
        return `${formatDate(customFrom)} – ${formatDate(customTo)}`;
      if (customFrom) return `Từ ${formatDate(customFrom)}`;
      if (customTo) return `Đến ${formatDate(customTo)}`;
    }
    return DATE_PRESETS.find((p) => p.key === datePreset)?.label ?? "";
  }, [datePreset, customFrom, customTo]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <View style={styles.activeChipsRow}>
          {statusFilter !== "all" && (
            <Chip
              compact
              onClose={() => setStatusFilter("all")}
              style={styles.activeChip}
              textStyle={CHIP_TEXT_ACTIVE}
            >
              {STATUS_FILTERS.find((f) => f.key === statusFilter)?.label}
            </Chip>
          )}
          {datePreset !== "all" && (
            <Chip
              compact
              onClose={() => {
                setDatePreset("all");
                setCustomFrom("");
                setCustomTo("");
              }}
              style={styles.activeChip}
              textStyle={CHIP_TEXT_ACTIVE}
            >
              {dateFilterLabel}
            </Chip>
          )}
        </View>
      )}

      {isLoading ? (
        <LoadingOverlay visible />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
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
            <EmptyState image={ReportPlaceholder} title="Không có báo cáo" />
          }
          stickySectionHeadersEnabled={false}
        />
      )}

      <FAB
        icon="plus"
        label="Tạo báo cáo"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => navigation.navigate("ReportCreate", {})}
      />

      {/* Filter bottom sheet */}
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
            style={[styles.filterSheet, { backgroundColor: theme.colors.surface }]}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.filterHeader}>
              <Text variant="titleMedium" style={{ fontWeight: "700" }}>
                Bộ lọc báo cáo
              </Text>
              <Button onPress={resetPending} compact>
                Đặt lại
              </Button>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Status */}
              <Text
                variant="labelSmall"
                style={[styles.filterLabel, { color: theme.colors.outline }]}
              >
                TRẠNG THÁI
              </Text>
              <View style={styles.chipRow}>
                {STATUS_FILTERS.map((f) => (
                  <Chip
                    key={f.key}
                    selected={pendingStatus === f.key}
                    onPress={() => setPendingStatus(f.key)}
                    style={[
                      styles.chip,
                      pendingStatus === f.key && {
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                    showSelectedCheck={false}
                    textStyle={
                      pendingStatus === f.key
                        ? { color: theme.colors.onPrimary }
                        : undefined
                    }
                  >
                    {f.label}
                  </Chip>
                ))}
              </View>

              <Divider style={styles.divider} />

              {/* Date range presets */}
              <Text
                variant="labelSmall"
                style={[styles.filterLabel, { color: theme.colors.outline }]}
              >
                KHOẢNG THỜI GIAN
              </Text>
              <View style={styles.chipRow}>
                {DATE_PRESETS.map((p) => (
                  <Chip
                    key={p.key}
                    selected={pendingDatePreset === p.key}
                    onPress={() => setPendingDatePreset(p.key)}
                    style={[
                      styles.chip,
                      pendingDatePreset === p.key && {
                        backgroundColor:
                          p.key === "custom"
                            ? theme.colors.secondary
                            : theme.colors.primary,
                      },
                    ]}
                    showSelectedCheck={false}
                    textStyle={
                      pendingDatePreset === p.key
                        ? { color: theme.colors.onPrimary }
                        : undefined
                    }
                  >
                    {p.label}
                  </Chip>
                ))}
              </View>

              {/* Preset range preview */}
              {pendingDatePreset !== "all" && pendingDatePreset !== "custom" && (() => {
                const { from, to } = getPresetRange(pendingDatePreset);
                return (
                  <View
                    style={[
                      styles.rangePreview,
                      { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="calendar-range"
                      size={14}
                      color={theme.colors.primary}
                    />
                    <Text
                      variant="labelSmall"
                      style={{ color: theme.colors.onSurfaceVariant, marginLeft: 6 }}
                    >
                      {from ? formatDate(from) : "—"} → {to ? formatDate(to) : "—"}
                    </Text>
                  </View>
                );
              })()}

              {/* Custom date pickers — shown when "Tùy chỉnh" is selected */}
              {pendingDatePreset === "custom" && (
                <View style={styles.customDateBlock}>
                  <DatePickerField
                    label="Từ ngày"
                    value={pendingCustomFrom}
                    onChange={setPendingCustomFrom}
                  />
                  <DatePickerField
                    label="Đến ngày"
                    value={pendingCustomTo}
                    onChange={setPendingCustomTo}
                  />
                </View>
              )}
            </ScrollView>

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
  listContent: { padding: 16, paddingBottom: 80, flexGrow: 1 },
  sectionHeader: { paddingVertical: 8, fontWeight: "600" },
  activeChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 6,
  },
  activeChip: {
    backgroundColor: "#E8F5E9",
    borderColor: "#2E7D32",
    borderWidth: 1.5,
    borderRadius: 20,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    borderRadius: 16,
    elevation: 8,
  },
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
    maxHeight: "85%",
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
  filterLabel: {
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 4 },
  chip: { borderRadius: 20, marginRight: 8, marginBottom: 8 },
  divider: { marginVertical: 12 },
  rangePreview: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  customDateBlock: {
    marginTop: 8,
    gap: 0,
  },
  applyBtn: { marginTop: 12, borderRadius: 12 },
});
