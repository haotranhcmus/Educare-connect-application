import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ActivityIndicator, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import "dayjs/locale/vi";

import { AvatarLabel } from "@components/common/AvatarLabel";
import {
  useMessages,
  useSendMessage,
  useMarkConversationRead,
  type ChatMessage,
} from "@hooks/useChat";
import { useKeyboardHeight } from "@hooks/useKeyboardHeight";
import type { ChatRoomParams } from "@navigation/types";

dayjs.locale("vi");

// ChatRoom lives inside both teacher's HomeStack and parent's
// ParentHomeStack. Use a self-contained route shape so the screen doesn't
// have to know which navigator hosts it.
type ChatRoomRouteProp = RouteProp<{ ChatRoom: ChatRoomParams }, "ChatRoom">;

/**
 * Insert day-divider rows ("Hôm nay" / "Hôm qua" / "DD/MM/YYYY") between
 * messages whose `created_at` falls on a different calendar day.
 */
type ChatRow =
  | { kind: "message"; message: ChatMessage }
  | { kind: "divider"; key: string; label: string };

function buildRows(messages: ChatMessage[]): ChatRow[] {
  const rows: ChatRow[] = [];
  let lastDay = "";
  for (const m of messages) {
    const day = dayjs(m.created_at).format("YYYY-MM-DD");
    if (day !== lastDay) {
      rows.push({
        kind: "divider",
        key: `d-${day}`,
        label: formatDayLabel(m.created_at),
      });
      lastDay = day;
    }
    rows.push({ kind: "message", message: m });
  }
  return rows;
}

function formatDayLabel(raw: string): string {
  const m = dayjs(raw);
  const today = dayjs();
  if (m.isSame(today, "day")) return "Hôm nay";
  if (m.isSame(today.subtract(1, "day"), "day")) return "Hôm qua";
  return m.format("DD/MM/YYYY");
}

export function ChatRoomScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<ChatRoomRouteProp>();
  const { conversationId, counterpartName, counterpartAvatar } = route.params;

  // Manual keyboard tracking — KeyboardAvoidingView misbehaves under
  // Android edge-to-edge (creates a phantom gap above the keyboard) and
  // needs device-specific offsets on iOS. Apply the height as the screen's
  // bottom padding instead.
  const keyboardHeight = useKeyboardHeight();
  const insets = useSafeAreaInsets();
  const isKbOpen = keyboardHeight > 0;

  const listRef = useRef<FlatList<ChatRow>>(null);
  const [input, setInput] = useState("");

  const { data: messages = [], isLoading } = useMessages(conversationId);
  const send = useSendMessage(conversationId);
  const markRead = useMarkConversationRead();

  // Custom header with counterpart avatar + name (no back button bloat).
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleRow}>
          <AvatarLabel
            uri={counterpartAvatar || undefined}
            name={counterpartName || "?"}
            size={32}
          />
          <Text
            variant="titleMedium"
            numberOfLines={1}
            style={styles.headerName}
          >
            {counterpartName}
          </Text>
        </View>
      ),
    });
  }, [navigation, counterpartName, counterpartAvatar]);

  // Mark conversation read whenever we enter or new messages arrive that
  // include unread ones from the counterpart.
  useEffect(() => {
    if (!conversationId) return;
    const hasUnreadFromOther = messages.some((m) => !m.from_me && !m.is_read);
    if (hasUnreadFromOther) {
      markRead.mutate(conversationId);
    }
    // Always mark on first mount so the badge clears even if local cache lags.
    if (messages.length === 0) {
      markRead.mutate(conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, messages.length]);

  // Auto-scroll to bottom whenever message count changes — or when the
  // keyboard opens (the visible viewport shrinks; the user expects the
  // latest message to remain in view).
  const rows = React.useMemo(() => buildRows(messages), [messages]);
  useEffect(() => {
    if (rows.length === 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [rows.length]);
  useEffect(() => {
    if (!isKbOpen) return;
    const t = setTimeout(
      () => listRef.current?.scrollToEnd({ animated: true }),
      120,
    );
    return () => clearTimeout(t);
  }, [isKbOpen]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !conversationId || send.isPending) return;
    setInput("");
    send.mutate(trimmed, {
      onError: () => {
        // Restore the input so the user doesn't lose what they typed.
        setInput(trimmed);
      },
    });
  }, [input, conversationId, send]);

  const canSend = input.trim().length > 0 && !send.isPending;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          // Lift the screen by the keyboard height so the composer sits
          // flush against the keyboard top instead of being covered.
          paddingBottom: isKbOpen ? keyboardHeight + 44 : 0,
        },
      ]}
    >
      {isLoading && messages.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={rows}
          keyExtractor={(row) =>
            row.kind === "divider" ? row.key : `m-${row.message.id}`
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) =>
            item.kind === "divider" ? (
              <DayDivider label={item.label} />
            ) : (
              <MessageBubble message={item.message} />
            )
          }
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons
                name="message-text-outline"
                size={48}
                color={theme.colors.outline}
              />
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.outline, marginTop: 12 }}
              >
                Hãy gửi tin nhắn đầu tiên
              </Text>
            </View>
          }
        />
      )}

      <View
        style={[
          styles.composer,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outlineVariant,
            // When the keyboard is up, the home-indicator / nav-bar area
            // is covered by the keyboard, so the safe-area inset is no
            // longer needed (would create a visible gap above the kb).
            paddingBottom: isKbOpen ? 8 : 8 + insets.bottom,
          },
        ]}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Nhập tin nhắn…"
          placeholderTextColor={theme.colors.outline}
          multiline
          style={[
            styles.input,
            {
              color: theme.colors.onSurface,
              backgroundColor: theme.colors.surfaceVariant,
            },
          ]}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          style={[
            styles.sendBtn,
            {
              backgroundColor: canSend
                ? theme.colors.primary
                : theme.colors.surfaceDisabled,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="send"
            size={20}
            color={canSend ? "#fff" : theme.colors.onSurfaceDisabled}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DayDivider({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.dividerRow}>
      <View
        style={[
          styles.dividerLine,
          { backgroundColor: theme.colors.outlineVariant },
        ]}
      />
      <Text
        variant="labelSmall"
        style={{ color: theme.colors.outline, marginHorizontal: 12 }}
      >
        {label}
      </Text>
      <View
        style={[
          styles.dividerLine,
          { backgroundColor: theme.colors.outlineVariant },
        ]}
      />
    </View>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const theme = useTheme();
  const mine = message.from_me;
  const time = dayjs(message.created_at).format("HH:mm");

  return (
    <View
      style={[
        styles.bubbleRow,
        { justifyContent: mine ? "flex-end" : "flex-start" },
      ]}
    >
      <View
        style={[
          styles.bubble,
          mine
            ? {
                backgroundColor: theme.colors.primary,
                borderBottomRightRadius: 4,
              }
            : {
                backgroundColor: theme.colors.surfaceVariant,
                borderBottomLeftRadius: 4,
              },
        ]}
      >
        <Text
          style={{
            color: mine ? "#fff" : theme.colors.onSurface,
            fontSize: 15,
            lineHeight: 20,
          }}
        >
          {message.content}
        </Text>
        <Text
          style={{
            color: mine
              ? "rgba(255,255,255,0.75)"
              : theme.colors.onSurfaceVariant,
            fontSize: 10,
            marginTop: 4,
            alignSelf: "flex-end",
          }}
        >
          {time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingVertical: 8, paddingHorizontal: 12, flexGrow: 1 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerName: {
    marginLeft: 8,
    fontWeight: "800",
    maxWidth: 200,
    color: "#fff",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },

  bubbleRow: { flexDirection: "row", marginVertical: 3 },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },

  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 8,
    // paddingBottom applied inline = 8 + safe-area inset (covers the
    // home-indicator / Android nav bar when the keyboard is closed).
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 20,
    fontSize: 15,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});
