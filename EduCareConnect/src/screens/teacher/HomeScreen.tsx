import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  View,
  ScrollView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@store/authStore";
import { useMyStudents } from "@hooks/useStudents";
import { useTodaySessions, useWeekMonthStats } from "@hooks/useSessions";
import { useSessionsForReport } from "@hooks/useReports";
import { useMyProfile } from "@hooks/useProfile";
import { queryKeys } from "@api/queryKeys";
import { AvatarLabel, ProgressRingAvatar } from "@components/common";
// import CoffeeSvg from "@assets/placeholder/svg/coffee-chill.svg";
import StudyJson from "@assets/placeholder/json/study.json";
import { TodaySessionCard } from "@components/session/TodaySessionCard";
import { StatusBadge } from "@components/common/StatusBadge";
import { NotificationBell } from "@components/notification/NotificationBell";
import { ChatBell } from "@components/chat/ChatBell";
import { useUnreadCount } from "@hooks/useNotification";
import { formatFloatTime } from "@utils/formatters";
import {
  SESSION_PURPOSE_LABELS,
  SESSION_TYPE_SHORT_LABELS,
  LOCATION_LABELS,
} from "@utils/labels";
import LottieView from "lottie-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TODAY_CARD_H = 162;
const CARD_W = SCREEN_WIDTH - 48; // visual card width
const CARD_SPACING = 8; // gap between cards
const CARD_PEEK = 24; // = (SCREEN_WIDTH - CARD_W) / 2 — content padding for centering
const SNAP_INTERVAL = CARD_W + CARD_SPACING; // FlatList snap interval

// ── Homescreen stat icons ────────────────────────────────────
const ICON_TODAY = require("../../../assets/homescreen_icon/7-days.png");
const ICON_WEEK = require("../../../assets/homescreen_icon/week.png");
const ICON_MONTH = require("../../../assets/homescreen_icon/month.png");
const ICON_REPORT = require("../../../assets/homescreen_icon/seo-report.png");
const ICON_SUN = require("../../../assets/homescreen_icon/sun.png");

export function HomeScreen({ navigation }: any) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { userName, centerName } = useAuthStore();
  const uid = useAuthStore((s) => s.uid);
  const queryClient = useQueryClient();
  const { data: todaySessions = [] } = useTodaySessions();
  const { data: unreadCount = 0 } = useUnreadCount();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselIndexRef = useRef(0);
  const flatListRef = useRef<FlatList>(null);
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToCard = useCallback((index: number, animated: boolean) => {
    flatListRef.current?.scrollToOffset({
      offset: index * SNAP_INTERVAL,
      animated,
    });
  }, []);

  // Auto-scroll forward every 4s; fast rewind when reaching end.
  // Pauses when user manually scrolls, resumes 5s after last interaction.
  useEffect(() => {
    if (todaySessions.length <= 1 || autoScrollPaused) return;
    const id = setInterval(() => {
      const len = todaySessions.length;
      const next = carouselIndexRef.current + 1;
      if (next >= len) {
        scrollToCard(0, true);
        carouselIndexRef.current = 0;
        setCarouselIndex(0);
      } else {
        scrollToCard(next, true);
        carouselIndexRef.current = next;
        setCarouselIndex(next);
      }
    }, 4000);
    return () => clearInterval(id);
  }, [todaySessions.length, autoScrollPaused, scrollToCard]);

  const handleScrollBeginDrag = useCallback(() => {
    setAutoScrollPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
  }, []);

  // Updates dots at the midpoint of each swipe (Math.round flips at 50%).
  // scrollEventThrottle=16 → ~60fps events, but setCarouselIndex only fires
  // when the rounded index actually changes → no wasted re-renders.
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = e.nativeEvent.contentOffset.x;
      const idx = Math.max(
        0,
        Math.min(Math.round(offset / SNAP_INTERVAL), todaySessions.length - 1),
      );
      if (idx !== carouselIndexRef.current) {
        carouselIndexRef.current = idx;
        setCarouselIndex(idx);
      }
    },
    [todaySessions.length],
  );

  const handleMomentumScrollEnd = useCallback(() => {
    // Resume auto-scroll 5s after user stops interacting
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => setAutoScrollPaused(false), 5000);
  }, []);

  // Invalidate today's sessions every time HomeScreen comes into focus
  // to ensure edits made in detail/edit screens are reflected immediately.
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.today(uid),
      });
    }, [queryClient, uid]),
  );
  const { data: noReportSessions = [] } = useSessionsForReport();
  const noReportIds = React.useMemo(
    () => new Set(noReportSessions.map((s) => s.id)),
    [noReportSessions],
  );
  const pendingCount = noReportSessions.length;
  const { data: students = [] } = useMyStudents();
  const { data: myProfile } = useMyProfile();
  const { week: weekCount, month: monthCount } = useWeekMonthStats();
  // Odoo's image_128 always returns a default letter avatar, so we additionally
  // gate on has_custom_avatar to fall back to the AvatarLabel initials when the
  // teacher hasn't actually uploaded a photo.
  const teacherAvatarUri =
    myProfile?.has_custom_avatar && myProfile?.avatar
      ? `data:image/png;base64,${myProfile.avatar}`
      : undefined;

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

  const handleSessionPress = (sessionId: number) => {
    navigation.getParent()?.navigate("SessionDetail" as any, { sessionId });
  };

  const handleStudentPress = (studentId: number) => {
    navigation.getParent()?.navigate("StudentDetail", { studentId });
  };

  // Helper: Odoo float time (e.g. 8.5 = 08:30) → minutes since midnight (integer, no float drift)
  const toMinutes = (floatTime: number): number => {
    const h = Math.floor(floatTime);
    return h * 60 + Math.round((floatTime - h) * 60);
  };
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const scheduledToday = todaySessions.filter((s) => s.status === "scheduled");

  // Ongoing: đã bắt đầu nhưng chưa kết thúc
  const ongoingSession =
    scheduledToday.find(
      (s) =>
        toMinutes(s.start_time) <= nowMinutes &&
        nowMinutes < toMinutes(s.end_time),
    ) ?? null;

  // Upcoming: chưa bắt đầu, lấy buổi gần nhất
  const upcomingSession =
    scheduledToday
      .filter((s) => toMinutes(s.start_time) > nowMinutes)
      .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time))[0] ??
    null;

  // Số phút đến khi buổi tiếp theo bắt đầu
  const minsUntilStart =
    upcomingSession != null
      ? toMinutes(upcomingSession.start_time) - nowMinutes
      : null;
  // "Sắp bắt đầu" khi upcoming chưa có ongoing và còn ≤15 phút
  const isStartingSoon =
    !ongoingSession && minsUntilStart !== null && minsUntilStart <= 15;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* ── Compact Header ──────────────────────────────────── */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <AvatarLabel
            uri={teacherAvatarUri}
            name={userName || "?"}
            size={42}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.greetLabel}>{greeting},</Text>
            <Text style={styles.greetName} numberOfLines={1}>
              {userName}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <ChatBell
              onPress={() => navigation.navigate("ConversationList")}
              color="#fff"
            />
            <NotificationBell
              unreadCount={unreadCount}
              onPress={() => navigation.navigate("NotificationList")}
              color="#fff"
            />
            {/* <View style={styles.datePill}>
              <Text style={styles.dateText}>{dateStr}</Text>
            </View> */}
          </View>
        </View>
      </LinearGradient>

      {/* ── Quick Stats Row — always 4 equal pills ─────────── */}
      <View style={styles.statsRow}>
        <StatPill
          icon={ICON_TODAY}
          label="Hôm nay"
          value={String(todaySessions.length)}
          color="#1565C0"
          bg="#E3F2FD"
        />
        <StatPill
          icon={ICON_WEEK}
          label="Tuần này"
          value={String(weekCount)}
          color="#2E7D32"
          bg="#E8F5E9"
        />
        <StatPill
          icon={ICON_MONTH}
          label="Tháng này"
          value={String(monthCount)}
          color="#6A1B9A"
          bg="#F3E5F5"
        />
        <StatPill
          icon={ICON_REPORT}
          label="Chưa báo cáo"
          value={String(pendingCount)}
          color={pendingCount > 0 ? "#E65100" : "#9E9E9E"}
          bg={pendingCount > 0 ? "#FFF3E0" : "#F5F5F5"}
          urgent={pendingCount > 0}
          onPress={
            pendingCount > 0
              ? () =>
                  navigation.navigate("SessionTab", {
                    screen: "SessionList",
                    params: { filterNoReport: true },
                  })
              : undefined
          }
        />
      </View>

      {/* ── Scrollable Content ─────────────────────────────── */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* ── Buổi sắp tới / Đang diễn ra / Motivational card ─── */}
        {/* Case A: đang diễn ra — luôn hiển thị trước */}
        {ongoingSession && (
          <TouchableOpacity
            onPress={() => handleSessionPress(ongoingSession.id)}
            activeOpacity={0.85}
            style={{ paddingHorizontal: 16, marginTop: 12 }}
          >
            <LinearGradient
              colors={["#1B5E20", "#388E3C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upcomingCard}
            >
              <View style={styles.upcomingRow}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                    gap: 5,
                  }}
                >
                  <MaterialCommunityIcons
                    name="play-circle-outline"
                    size={16}
                    color="rgba(255,255,255,0.85)"
                  />
                  <Text style={styles.upcomingLabel}>Đang diễn ra</Text>
                  <View style={styles.liveDot} />
                </View>
                <Text style={styles.upcomingTimeText}>
                  {formatFloatTime(ongoingSession.start_time)} –{" "}
                  {formatFloatTime(ongoingSession.end_time)}
                </Text>
              </View>
              <Text style={styles.upcomingStudent} numberOfLines={1}>
                {ongoingSession.student_name ||
                  (Array.isArray(ongoingSession.student_id)
                    ? ongoingSession.student_id[1]
                    : "")}
              </Text>
              <View style={styles.upcomingRow}>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 6,
                    flexWrap: "wrap",
                    flex: 1,
                  }}
                >
                  <View style={styles.upcomingBadge}>
                    <Text style={styles.upcomingBadgeText}>
                      {SESSION_PURPOSE_LABELS[ongoingSession.session_purpose] ||
                        ongoingSession.session_purpose}
                    </Text>
                  </View>
                  <View style={styles.upcomingBadge}>
                    <Text style={styles.upcomingBadgeText}>
                      {SESSION_TYPE_SHORT_LABELS[ongoingSession.session_type] ||
                        ongoingSession.session_type}
                    </Text>
                  </View>
                  <View style={styles.upcomingBadge}>
                    <Text style={styles.upcomingBadgeText}>
                      {LOCATION_LABELS[ongoingSession.location] ||
                        ongoingSession.location}
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color="rgba(255,255,255,0.7)"
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Case B: buổi tiếp theo (upcoming) — hiển thị dù có hay không có ongoing */}
        {upcomingSession ? (
          <TouchableOpacity
            onPress={() => handleSessionPress(upcomingSession.id)}
            activeOpacity={0.85}
            style={{
              paddingHorizontal: 16,
              marginTop: ongoingSession ? 8 : 12,
            }}
          >
            <LinearGradient
              colors={
                isStartingSoon ? ["#BF360C", "#E64A19"] : ["#1565C0", "#1976D2"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={ongoingSession ? styles.nextCard : styles.upcomingCard}
            >
              <View style={styles.upcomingRow}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                    gap: 5,
                  }}
                >
                  <MaterialCommunityIcons
                    name={isStartingSoon ? "clock-alert-outline" : "clock-fast"}
                    size={ongoingSession ? 14 : 16}
                    color="rgba(255,255,255,0.85)"
                  />
                  <Text
                    style={
                      ongoingSession ? styles.nextLabel : styles.upcomingLabel
                    }
                  >
                    {ongoingSession
                      ? `Tiếp theo hôm nay`
                      : isStartingSoon
                        ? `Sắp bắt đầu sau ${minsUntilStart} phút`
                        : "Buổi học sắp tới hôm nay"}
                  </Text>
                </View>
                <Text
                  style={
                    ongoingSession
                      ? styles.nextTimeText
                      : styles.upcomingTimeText
                  }
                >
                  {formatFloatTime(upcomingSession.start_time)} –{" "}
                  {formatFloatTime(upcomingSession.end_time)}
                </Text>
              </View>
              <Text
                style={
                  ongoingSession ? styles.nextStudent : styles.upcomingStudent
                }
                numberOfLines={1}
              >
                {upcomingSession.student_name ||
                  (Array.isArray(upcomingSession.student_id)
                    ? upcomingSession.student_id[1]
                    : "")}
              </Text>
              <View style={styles.upcomingRow}>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 6,
                    flexWrap: "wrap",
                    flex: 1,
                  }}
                >
                  <View style={styles.upcomingBadge}>
                    <Text style={styles.upcomingBadgeText}>
                      {SESSION_PURPOSE_LABELS[
                        upcomingSession.session_purpose
                      ] || upcomingSession.session_purpose}
                    </Text>
                  </View>
                  <View style={styles.upcomingBadge}>
                    <Text style={styles.upcomingBadgeText}>
                      {SESSION_TYPE_SHORT_LABELS[
                        upcomingSession.session_type
                      ] || upcomingSession.session_type}
                    </Text>
                  </View>
                  <View style={styles.upcomingBadge}>
                    <Text style={styles.upcomingBadgeText}>
                      {LOCATION_LABELS[upcomingSession.location] ||
                        upcomingSession.location}
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color="rgba(255,255,255,0.7)"
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : !ongoingSession ? (
          <View style={styles.motivationalCard}>
            <View style={styles.motivationalIconWrap}>
              <Image
                source={ICON_SUN}
                style={styles.motivationalIcon}
                resizeMode="contain"
              />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                variant="titleSmall"
                style={{ fontWeight: "700", color: "#5D4037" }}
              >
                {weekCount > 0
                  ? `${weekCount} buổi đã dạy tuần này 🎉`
                  : "Bắt đầu một ngày tuyệt vời!"}
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: "#795548", marginTop: 2 }}
              >
                {monthCount > 0
                  ? `Tổng ${monthCount} buổi trong tháng này`
                  : "Chưa có buổi học hôm nay"}
              </Text>
            </View>
          </View>
        ) : null}

        {/* ── Hôm nay ─── */}
        <HomeSectionLabel
          icon="calendar-today"
          label="Hôm nay"
          count={todaySessions.length}
          countUnit="buổi học"
        />
        {todaySessions.length > 1 ? (
          <View>
            <FlatList
              ref={flatListRef}
              horizontal
              data={todaySessions}
              keyExtractor={(s) => String(s.id)}
              showsHorizontalScrollIndicator={false}
              snapToInterval={SNAP_INTERVAL}
              decelerationRate="fast"
              contentContainerStyle={styles.carouselContent}
              getItemLayout={(_, index) => ({
                length: SNAP_INTERVAL,
                offset: CARD_PEEK + index * SNAP_INTERVAL,
                index,
              })}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onScrollBeginDrag={handleScrollBeginDrag}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.carouselItem,
                    {
                      marginRight:
                        index < todaySessions.length - 1 ? CARD_SPACING : 0,
                    },
                  ]}
                >
                  <TodaySessionCard
                    session={item}
                    onPress={() => handleSessionPress(item.id)}
                    hasReport={!noReportIds.has(item.id)}
                  />
                </View>
              )}
            />
            <View style={styles.dotsRow}>
              {todaySessions.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === carouselIndex ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          </View>
        ) : todaySessions.length === 1 ? (
          <View style={styles.singleCardPad}>
            <TodaySessionCard
              session={todaySessions[0]}
              onPress={() => handleSessionPress(todaySessions[0].id)}
              hasReport={!noReportIds.has(todaySessions[0].id)}
            />
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.emptyDay}>
              <LottieView
                source={StudyJson}
                autoPlay
                loop
                style={{ width: 120, height: 120 }}
              />
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.outline, marginTop: 12 }}
              >
                Không có buổi học hôm nay
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.outlineVariant, marginTop: 4 }}
              >
                Hãy tận dụng thời gian chuẩn bị kế hoạch 📋
              </Text>
            </View>
          </View>
        )}

        {/* ── Học sinh của tôi ─── */}
        <HomeSectionLabel
          icon="account-group"
          label="Học sinh"
          count={students.length}
          countUnit="HS"
          action={{
            label: "Xem tất cả",
            onPress: () =>
              navigation.navigate("StudentTab", { screen: "StudentList" }),
          }}
        />
        <View style={styles.section}>
          {students.slice(0, 4).map((s) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => handleStudentPress(s.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.studentRow,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                {/* Avatar with IEP progress ring */}
                <ProgressRingAvatar
                  uri={s.avatar_url}
                  name={s.name}
                  size={44}
                  progress={(s as any).iep_progress_pct ?? 0}
                  ringColor={theme.colors.primary}
                  trackColor={theme.colors.outlineVariant}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text variant="bodyMedium" style={{ fontWeight: "700" }}>
                    {s.nickname || s.name}
                  </Text>
                  {s.nickname && (
                    <Text
                      variant="labelSmall"
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        marginTop: 1,
                      }}
                    >
                      {s.name}
                    </Text>
                  )}
                  {(s as any).iep_progress_pct != null && (
                    <Text
                      variant="labelSmall"
                      style={{ color: theme.colors.outline, marginTop: 1 }}
                    >
                      IEP {Math.round((s as any).iep_progress_pct)}%
                    </Text>
                  )}
                </View>
                {/* <StatusBadge status={s.status} size="small" /> */}
              </View>
            </TouchableOpacity>
          ))}
          {students.length > 4 && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("StudentTab", { screen: "StudentList" })
              }
            >
              <Text
                variant="labelMedium"
                style={{
                  color: theme.colors.primary,
                  paddingHorizontal: 4,
                  paddingVertical: 8,
                }}
              >
                + {students.length - 4} học sinh khác →
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ── Home Section Label ────────────────────────────────────────
function HomeSectionLabel({
  icon,
  label,
  count,
  countUnit,
  action,
}: {
  icon: string;
  label: string;
  count?: number;
  countUnit?: string;
  action?: { label: string; onPress: () => void };
}) {
  const theme = useTheme();
  return (
    <View style={hlStyles.row}>
      {/* Icon bubble */}
      <View
        style={[
          hlStyles.iconBubble,
          { backgroundColor: `${theme.colors.primary}18` },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={15}
          color={theme.colors.primary}
        />
      </View>

      {/* Label + count pill */}
      <View style={hlStyles.titleBlock}>
        <Text style={[hlStyles.label, { color: theme.colors.onSurface }]}>
          {label}
        </Text>
        {count !== undefined && (
          <View
            style={[
              hlStyles.countPill,
              { backgroundColor: `${theme.colors.primary}14` },
            ]}
          >
            <Text style={[hlStyles.countText, { color: theme.colors.primary }]}>
              {count} {countUnit}
            </Text>
          </View>
        )}
      </View>

      {/* Action link */}
      {action && (
        <TouchableOpacity
          onPress={action.onPress}
          style={hlStyles.actionBtn}
          activeOpacity={0.65}
        >
          <Text style={[hlStyles.actionText, { color: theme.colors.primary }]}>
            {action.label}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={14}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const hlStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 10,
  },
  iconBubble: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  countPill: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

// ── Stat Pill ──────────────────────────────────────────────────
function StatPill({
  icon,
  label,
  value,
  color,
  bg,
  urgent,
  onPress,
}: {
  icon: ReturnType<typeof require>;
  label: string;
  value: string;
  color: string;
  bg: string;
  urgent?: boolean;
  onPress?: () => void;
}) {
  const inner = (
    <View style={[styles.statPill, { backgroundColor: bg }]}>
      {urgent && <View style={styles.urgentDot} />}
      <View style={[styles.statIconWrap, { backgroundColor: color + "20" }]}>
        <Image source={icon} style={styles.statIconImg} resizeMode="contain" />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={styles.statPillWrapper}
        activeOpacity={0.75}
      >
        {inner}
      </TouchableOpacity>
    );
  }
  return <View style={styles.statPillWrapper}>{inner}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Header
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  greetLabel: { color: "rgba(255,255,255,0.80)", fontSize: 11 },
  greetName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  datePill: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dateText: { color: "#fff", fontSize: 11, fontWeight: "500" },
  // Quick stats
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  statPillWrapper: { flex: 1 },
  statPill: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 2,
    elevation: 2,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statIconImg: {
    width: 18,
    height: 18,
  },
  statValue: { fontSize: 17, fontWeight: "800", lineHeight: 21 },
  statLabel: { fontSize: 9, fontWeight: "600", textAlign: "center" },
  urgentDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E65100",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  // Cards
  upcomingCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 4,
    elevation: 4,
    gap: 6,
  },
  upcomingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  upcomingLabel: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 11,
    fontWeight: "500",
  },
  upcomingTimeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  upcomingStudent: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  upcomingBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  upcomingBadgeText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 10,
    fontWeight: "600",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#69F0AE",
  },
  // Compact "Tiếp theo" card shown below the ongoing card
  nextCard: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 4,
    elevation: 3,
    gap: 4,
  },
  nextLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "500",
  },
  nextStudent: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  nextTimeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  motivationalCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FFFDE7",
    elevation: 1,
  },
  motivationalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFF9C4",
    alignItems: "center",
    justifyContent: "center",
  },
  motivationalIcon: {
    width: 28,
    height: 28,
  },
  // Content
  section: { paddingHorizontal: 16, marginBottom: 16 },
  carouselContent: { paddingHorizontal: CARD_PEEK },
  carouselItem: { width: CARD_W },
  singleCardPad: { paddingHorizontal: 16, marginBottom: 16 },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    marginBottom: 12,
  },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 18, backgroundColor: "#2E7D32" },
  dotInactive: { width: 6, backgroundColor: "#C8E6C9" },
  emptyDay: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 24,
    backgroundColor: "transparent",
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    marginBottom: 6,
    // shadowColor: "#000",
    // shadowOpacity: 0.04,
    // shadowRadius: 4,
    // shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
});
