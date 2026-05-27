import React, { useCallback, useMemo } from "react";
import {
  RefreshControl,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import {
  useNotificationList,
  useMarkRead,
  type NotificationItem,
} from "@hooks/useNotification";
import { useAuthStore } from "@store/authStore";
import { resolveNotificationTarget } from "@utils/notificationRouter";
import { EmptyState } from "@components/common/EmptyState";
import { AvatarLabel } from "@components/common/AvatarLabel";

dayjs.locale("vi");

const ICON_BY_TYPE: Record<
  string,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  report_published: "file-document",
  session_cancelled: "calendar-remove",
  iep_completed: "trophy",
  goal_achieved: "check-circle",
  new_chat_message: "chat",
};

const ICON_BG = "#E8F8EF";
const ICON_FG = "#27AE60";

interface Section {
  title: string; // "DD-MM-YYYY"
  data: NotificationItem[];
}

/** Group notifications by their `created_at` date, newest day first. */
function groupByDay(items: NotificationItem[]): Section[] {
  const buckets = new Map<string, NotificationItem[]>();
  for (const item of items) {
    const key = dayjs(item.created_at).format("DD-MM-YYYY");
    const arr = buckets.get(key);
    if (arr) arr.push(item);
    else buckets.set(key, [item]);
  }
  // Items are already ordered newest-first by the API; preserve insertion order.
  return Array.from(buckets.entries()).map(([title, data]) => ({
    title,
    data,
  }));
}

export function NotificationListScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const role = useAuthStore((s) => s.role);
  const {
    data: items = [],
    isLoading,
    refetch,
    isRefetching,
  } = useNotificationList(false);
  const markRead = useMarkRead();

  const sections = useMemo(() => groupByDay(items), [items]);

  const handlePress = useCallback(
    (item: NotificationItem) => {
      // For chat notis, opening the room reads ALL of that conversation's
      // messages — so the whole batch of unread chat notis sharing the same
      // ref_id is logically read too. Mark them in a single mutation
      // (idempotent with the backend mark-read which does the same on
      // ChatRoom mount; this just makes the list update instantly).
      if (item.type === "new_chat_message" && item.ref_id) {
        const relatedIds = items
          .filter(
            (n) =>
              !n.is_read &&
              n.type === "new_chat_message" &&
              n.ref_id === item.ref_id,
          )
          .map((n) => n.id);
        if (relatedIds.length > 0) {
          markRead.mutate({ ids: relatedIds });
        }
      } else if (!item.is_read) {
        markRead.mutate({ ids: [item.id] });
      }

      const target = resolveNotificationTarget(role, {
        type: item.type,
        ref_model: item.ref_model,
        ref_id: item.ref_id,
        title: item.title, // fallback when icon_name absent (push payloads)
        icon_avatar: item.icon_avatar,
        icon_name: item.icon_name,
      });
      if (!target) return;
      navigation.navigate(target.screen, target.params);
    },
    [navigation, role, markRead, items],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["bottom"]}
    >
      <SectionList
        sections={sections}
        keyExtractor={(it) => String(it.id)}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} count={section.data.length} />
        )}
        renderItem={({ item }) => (
          <NotificationRow item={item} onPress={() => handlePress(item)} />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="bell-off"
                title="Chưa có thông báo"
                description="Khi có sự kiện mới, thông báo sẽ hiển thị ở đây."
              />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.sectionHeader,
        { backgroundColor: theme.colors.surfaceVariant },
      ]}
    >
      <Text
        variant="labelMedium"
        style={{ color: theme.colors.onSurfaceVariant, fontWeight: "600" }}
      >
        Ngày {title}
      </Text>
      <Text
        variant="labelMedium"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        Tin nhắn ({count})
      </Text>
    </View>
  );
}

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: () => void;
}) {
  const theme = useTheme();
  const iconName = ICON_BY_TYPE[item.type] ?? "bell";
  const timestamp = dayjs(item.created_at).format("DD-MM-YYYY HH:mm:ss");
  // Chat notifications show the sender's real avatar instead of the generic
  // icon circle. Backend serializes icon_avatar (data URI) and icon_name
  // (used as initials fallback). For any other type, fall through to the icon.
  const isChat = item.type === "new_chat_message";
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.row, { backgroundColor: theme.colors.surface }]}
    >
      {isChat ? (
        <View style={styles.avatarWrap}>
          <AvatarLabel
            uri={item.icon_avatar || undefined}
            name={item.icon_name || "?"}
            size={40}
          />
        </View>
      ) : (
        <View style={[styles.iconWrap, { backgroundColor: ICON_BG }]}>
          <MaterialCommunityIcons name={iconName} size={22} color={ICON_FG} />
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            variant="bodyMedium"
            numberOfLines={1}
            style={[styles.title, { fontWeight: item.is_read ? "500" : "700" }]}
          >
            {item.title}
          </Text>
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.outline, marginLeft: 8 }}
          >
            {timestamp}
          </Text>
        </View>
        <Text
          variant="bodySmall"
          numberOfLines={2}
          style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
        >
          {item.body}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarWrap: {
    marginRight: 12,
  },
  body: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { flex: 1 },
  emptyWrap: { paddingTop: 80, alignItems: "center" },
});
