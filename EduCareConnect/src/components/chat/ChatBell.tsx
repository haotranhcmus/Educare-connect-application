import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useChatUnreadCount } from "@hooks/useChat";

interface Props {
  onPress: () => void;
  /** Defaults to white so the icon shows up on gradient headers. */
  color?: string;
  size?: number;
}

/**
 * Header chat icon with an unread-count badge. Mirrors NotificationBell so
 * both icons sit side-by-side on the home headers.
 */
export function ChatBell({ onPress, color = "#fff", size = 22 }: Props) {
  const { data: unread = 0 } = useChatUnreadCount();
  return (
    <TouchableOpacity onPress={onPress} style={styles.btn} hitSlop={8}>
      <MaterialCommunityIcons name="chat" size={size} color={color} />
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 99 ? "99+" : unread}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 4 },
  badge: {
    position: "absolute",
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
  },
});
