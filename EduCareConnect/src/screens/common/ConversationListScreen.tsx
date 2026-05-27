import React, { useCallback } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import dayjs from "dayjs";
import "dayjs/locale/vi";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AvatarLabel } from "@components/common/AvatarLabel";
import { EmptyState } from "@components/common/EmptyState";
import { useConversations, type ConversationItem } from "@hooks/useChat";

import { theme } from "@/src/theme";

const AI_BRAND = theme.colors.primary;

dayjs.locale("vi");

/**
 * Format the last-message timestamp for a chat row:
 * - today  → HH:mm
 * - this week → e.g. "T3" (T2..CN)
 * - earlier → DD/MM
 */
function formatChatTime(raw: string | null): string {
  if (!raw) return "";
  const m = dayjs(raw);
  if (!m.isValid()) return "";
  const now = dayjs();
  if (m.isSame(now, "day")) return m.format("HH:mm");
  const diffDays = now.diff(m, "day");
  if (diffDays < 7) {
    const dow = m.day(); // 0 = Sun … 6 = Sat
    const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return labels[dow];
  }
  return m.format("DD/MM");
}

export function ConversationListScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const {
    data: conversations = [],
    isLoading,
    refetch,
    isRefetching,
  } = useConversations();

  const handleOpen = useCallback(
    (item: ConversationItem) => {
      navigation.navigate("ChatRoom", {
        conversationId: item.id,
        counterpartName: item.counterpart_name,
        counterpartAvatar: item.counterpart_avatar,
      });
    },
    [navigation],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["bottom"]}
    >
      <FlatList
        data={conversations}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListHeaderComponent={
          <AiAssistantRow
            onPress={() => navigation.navigate("AiChat")}
            borderColor={theme.colors.outlineVariant}
            background={theme.colors.surface}
            textColor={theme.colors.onSurface}
            subtitleColor={theme.colors.onSurfaceVariant}
          />
        }
        ItemSeparatorComponent={() => (
          <View
            style={[
              styles.separator,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
        )}
        renderItem={({ item }) => (
          <ConversationRow item={item} onPress={() => handleOpen(item)} />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="chat-outline"
                title="Chưa có cuộc trò chuyện"
                description="Khi phụ huynh hoặc giáo viên liên quan tới học sinh nhắn tin, cuộc trò chuyện sẽ xuất hiện ở đây."
              />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

/**
 * Pinned row at the top of the conversation list that opens the AI chat.
 * Visually distinct (purple avatar + "AI" label) so users don't confuse it
 * with a human contact.
 */
function AiAssistantRow({
  onPress,
  borderColor,
  background,
  textColor,
  subtitleColor,
}: {
  onPress: () => void;
  borderColor: string;
  background: string;
  textColor: string;
  subtitleColor: string;
}) {
  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.row, { backgroundColor: background }]}
      >
        <View style={styles.aiAvatar}>
          <MaterialCommunityIcons name="robot-happy" size={28} color="#fff" />
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text
              variant="bodyLarge"
              numberOfLines={1}
              style={[styles.name, { fontWeight: "700", color: textColor }]}
            >
              Trợ lý AI
            </Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          </View>
          <Text
            variant="bodySmall"
            numberOfLines={1}
            style={{ color: subtitleColor, marginTop: 4 }}
          >
            Hỏi bất cứ điều gì — sẵn sàng 24/7
          </Text>
        </View>
      </TouchableOpacity>
      <View
        style={[
          styles.separator,
          { backgroundColor: borderColor, marginLeft: 0 },
        ]}
      />
    </>
  );
}

function ConversationRow({
  item,
  onPress,
}: {
  item: ConversationItem;
  onPress: () => void;
}) {
  const theme = useTheme();
  const hasUnread = item.unread_count > 0;
  const time = formatChatTime(item.last_message_at);
  const previewPrefix = item.last_message_from_me ? "Bạn: " : "";
  const preview = item.last_message_preview
    ? previewPrefix + item.last_message_preview
    : "Chưa có tin nhắn";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.row, { backgroundColor: theme.colors.surface }]}
    >
      <AvatarLabel
        uri={item.counterpart_avatar || undefined}
        name={item.counterpart_name || "?"}
        size={48}
      />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            variant="bodyLarge"
            numberOfLines={1}
            style={[styles.name, { fontWeight: hasUnread ? "700" : "600" }]}
          >
            {item.counterpart_name || "Người dùng"}
          </Text>
          {time ? (
            <Text
              variant="labelSmall"
              style={{
                color: hasUnread ? theme.colors.primary : theme.colors.outline,
                fontWeight: hasUnread ? "700" : "500",
                marginLeft: 8,
              }}
            >
              {time}
            </Text>
          ) : null}
        </View>
        <View style={styles.previewRow}>
          <Text
            variant="bodySmall"
            numberOfLines={1}
            style={{
              flex: 1,
              color: hasUnread
                ? theme.colors.onSurface
                : theme.colors.onSurfaceVariant,
              fontWeight: hasUnread ? "600" : "400",
            }}
          >
            {preview}
          </Text>
          {hasUnread ? (
            <View
              style={[
                styles.unreadBadge,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.unreadText}>
                {item.unread_count > 99 ? "99+" : item.unread_count}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 76,
  },
  body: { flex: 1, marginLeft: 12 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: { flex: 1 },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  unreadText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  emptyWrap: { paddingTop: 80, alignItems: "center" },
  aiAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AI_BRAND,
    alignItems: "center",
    justifyContent: "center",
  },
  aiBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: AI_BRAND,
  },
  aiBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});
