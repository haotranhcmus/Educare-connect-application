import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ActivityIndicator, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import "dayjs/locale/vi";

import { AvatarLabel } from "@components/common/AvatarLabel";
import {
  useAiSession,
  useAiMessages,
  useSendAiMessage,
  useResetAiSession,
  type AiMessage,
} from "@hooks/useAiChat";
import { useKeyboardHeight } from "@hooks/useKeyboardHeight";

import { theme } from "@/src/theme";

dayjs.locale("vi");

const AI_BRAND = theme.colors.primary; // distinct from primary green so AI bubbles read as "different"

type Row =
  | { kind: "message"; message: AiMessage }
  | { kind: "divider"; key: string; label: string }
  | { kind: "typing"; key: "typing" };

function dayLabel(raw: string): string {
  const m = dayjs(raw);
  const today = dayjs();
  if (m.isSame(today, "day")) return "Hôm nay";
  if (m.isSame(today.subtract(1, "day"), "day")) return "Hôm qua";
  return m.format("DD/MM/YYYY");
}

function buildRows(messages: AiMessage[], isTyping: boolean): Row[] {
  const rows: Row[] = [];
  let lastDay = "";
  for (const m of messages) {
    const d = dayjs(m.created_at).format("YYYY-MM-DD");
    if (d !== lastDay) {
      rows.push({
        kind: "divider",
        key: `d-${d}`,
        label: dayLabel(m.created_at),
      });
      lastDay = d;
    }
    rows.push({ kind: "message", message: m });
  }
  if (isTyping) rows.push({ kind: "typing", key: "typing" });
  return rows;
}

export function AiChatScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  // Manual keyboard tracking — see useKeyboardHeight for the rationale
  // (KeyboardAvoidingView is broken under Expo edge-to-edge on Android).
  const keyboardHeight = useKeyboardHeight();
  const insets = useSafeAreaInsets();
  const isKbOpen = keyboardHeight > 0;

  const {
    data: session,
    isLoading: sessionLoading,
    refetch: refetchSession,
  } = useAiSession();
  const channelId = session?.ok ? session.channel_id : undefined;
  const agentName = session?.agent_name || "Trợ lý AI";
  const agentAvatar = session?.agent_avatar || null;

  const { data: messages = [], isLoading: msgsLoading } =
    useAiMessages(channelId);
  const send = useSendAiMessage(channelId);
  const reset = useResetAiSession();

  const listRef = useRef<FlatList<Row>>(null);
  const [input, setInput] = useState("");

  const rows = useMemo(
    () => buildRows(messages, send.isPending),
    [messages, send.isPending],
  );

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleRow}>
          <AvatarLabel
            uri={agentAvatar || undefined}
            name={agentName}
            size={32}
            backgroundColor={AI_BRAND}
          />
          <View style={{ marginLeft: 8 }}>
            <Text
              variant="titleMedium"
              style={styles.headerName}
              numberOfLines={1}
            >
              {agentName}
            </Text>
            <Text style={styles.headerSubtitle}>Trợ lý AI · sẵn sàng</Text>
          </View>
        </View>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, agentName, agentAvatar, channelId]);

  useEffect(() => {
    if (rows.length === 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [rows.length]);
  // Re-pin to the latest message when the keyboard opens (viewport shrinks).
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
    if (!trimmed || !channelId || send.isPending) return;
    setInput("");
    send.mutate(trimmed);
  }, [input, channelId, send]);

  const handleReset = useCallback(() => {
    if (!channelId) return;
    Alert.alert(
      "Bắt đầu cuộc trò chuyện mới?",
      "Toàn bộ nội dung hiện tại sẽ bị xoá.",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá & bắt đầu lại",
          style: "destructive",
          onPress: () => reset.mutate(channelId),
        },
      ],
    );
  }, [channelId, reset]);

  const canSend = input.trim().length > 0 && !send.isPending && !!channelId;

  // Configuration error UI (no agent set up, etc).
  if (session && !session.ok) {
    return (
      <View
        style={[styles.errorWrap, { backgroundColor: theme.colors.background }]}
      >
        <MaterialCommunityIcons
          name="robot-confused-outline"
          size={56}
          color={theme.colors.outline}
        />
        <Text variant="titleMedium" style={{ marginTop: 12 }}>
          Trợ lý AI chưa sẵn sàng
        </Text>
        <Text
          variant="bodySmall"
          style={{
            color: theme.colors.onSurfaceVariant,
            textAlign: "center",
            marginTop: 8,
            paddingHorizontal: 32,
          }}
        >
          {session.error || "Liên hệ quản trị viên để cấu hình."}
        </Text>
        <TouchableOpacity
          onPress={() => refetchSession()}
          style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          // Lift the entire screen by the keyboard height when it's open
          // so the composer hugs the keyboard top without a phantom gap.
          paddingBottom: isKbOpen ? keyboardHeight + 44 : 0,
        },
      ]}
    >
      {sessionLoading || (msgsLoading && messages.length === 0) ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={rows}
          keyExtractor={(row) =>
            row.kind === "divider"
              ? row.key
              : row.kind === "typing"
                ? "typing"
                : `m-${row.message.id}`
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            if (item.kind === "divider")
              return <DayDivider label={item.label} />;
            if (item.kind === "typing")
              return <TypingBubble agentName={agentName} />;
            return (
              <MessageBubble
                message={item.message}
                agentName={agentName}
                agentAvatar={agentAvatar}
              />
            );
          }}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View
                style={[styles.aiHero, { backgroundColor: AI_BRAND + "22" }]}
              >
                <MaterialCommunityIcons
                  name="robot-happy-outline"
                  size={48}
                  color={AI_BRAND}
                />
              </View>
              <Text variant="titleMedium" style={{ marginTop: 12 }}>
                Chào! Tôi là {agentName}
              </Text>
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  textAlign: "center",
                  marginTop: 6,
                  paddingHorizontal: 32,
                }}
              >
                Hỏi bất cứ điều gì về buổi học, IEP, báo cáo, hoặc các chủ đề
                giáo dục can thiệp sớm.
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
            // Bottom safe-area only when keyboard is hidden (otherwise the
            // keyboard already covers that area — adding it duplicates).
            paddingBottom: isKbOpen ? 8 : 8 + insets.bottom,
          },
        ]}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Hỏi trợ lý AI…"
          placeholderTextColor={theme.colors.outline}
          multiline
          editable={!!channelId}
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
                ? AI_BRAND
                : theme.colors.surfaceDisabled,
            },
          ]}
        >
          {send.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons
              name="send"
              size={20}
              color={canSend ? "#fff" : theme.colors.onSurfaceDisabled}
            />
          )}
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

function MessageBubble({
  message,
  agentName,
  agentAvatar,
}: {
  message: AiMessage;
  agentName: string;
  agentAvatar: string | null;
}) {
  const theme = useTheme();
  const isAi = message.from_ai;
  const isError = message.is_error === true;
  const time = dayjs(message.created_at).format("HH:mm");

  let bubbleBg: string;
  if (!isAi) {
    bubbleBg = AI_BRAND;
  } else if (isError) {
    bubbleBg = theme.colors.errorContainer;
  } else {
    bubbleBg = theme.colors.surfaceVariant;
  }

  return (
    <View
      style={[
        styles.bubbleRow,
        { justifyContent: isAi ? "flex-start" : "flex-end" },
      ]}
    >
      {isAi ? (
        <View style={{ marginRight: 6, marginTop: 2 }}>
          <AvatarLabel
            uri={isError ? undefined : (agentAvatar || undefined)}
            name={isError ? "!" : agentName}
            size={24}
            backgroundColor={isError ? theme.colors.error : AI_BRAND}
          />
        </View>
      ) : null}
      <View
        style={[
          styles.bubble,
          isAi
            ? { backgroundColor: bubbleBg, borderBottomLeftRadius: 4 }
            : { backgroundColor: bubbleBg, borderBottomRightRadius: 4 },
        ]}
      >
        {isError && (
          <View style={styles.errorHeader}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={13}
              color={theme.colors.error}
            />
            <Text style={[styles.errorLabel, { color: theme.colors.error }]}>
              Lỗi
            </Text>
          </View>
        )}
        <Text
          style={{
            color: isError
              ? theme.colors.onErrorContainer
              : isAi
                ? theme.colors.onSurface
                : "#fff",
            fontSize: 15,
            lineHeight: 20,
          }}
        >
          {message.content}
        </Text>
        <Text
          style={{
            color: isError
              ? theme.colors.error
              : isAi
                ? theme.colors.onSurfaceVariant
                : "rgba(255,255,255,0.75)",
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

function TypingBubble({ agentName }: { agentName: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.bubbleRow, { justifyContent: "flex-start" }]}>
      <View style={{ marginRight: 6, marginTop: 2 }}>
        <AvatarLabel name={agentName} size={24} backgroundColor={AI_BRAND} />
      </View>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderBottomLeftRadius: 4,
            flexDirection: "row",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="small" color={AI_BRAND} />
        <Text
          style={{
            marginLeft: 8,
            color: theme.colors.onSurfaceVariant,
            fontStyle: "italic",
            fontSize: 14,
          }}
        >
          AI đang nghĩ…
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingVertical: 8, paddingHorizontal: 12, flexGrow: 1 },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  errorWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  aiHero: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center" },
  headerName: { color: "#fff", fontWeight: "700" },
  headerSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
  },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  bubbleRow: {
    flexDirection: "row",
    marginVertical: 3,
    alignItems: "flex-end",
  },
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
  errorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  errorLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
