import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  unreadCount: number;
  onPress: () => void;
  /** Defaults to white so the bell shows up on gradient headers. */
  color?: string;
  size?: number;
}

export function NotificationBell({
  unreadCount,
  onPress,
  color = "#fff",
  size = 22,
}: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.btn} hitSlop={8}>
      <MaterialCommunityIcons name="bell" size={size} color={color} />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
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
