import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnlineStatus } from "@hooks/useOnlineStatus";

export function OfflineBanner() {
  const theme = useTheme();
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.wrap, { backgroundColor: theme.colors.errorContainer }]}
    >
      <View style={styles.row}>
        <MaterialCommunityIcons
          name="wifi-off"
          size={14}
          color={theme.colors.onErrorContainer}
        />
        <Text
          variant="labelSmall"
          style={{
            color: theme.colors.onErrorContainer,
            fontWeight: "600",
            marginLeft: 6,
          }}
        >
          Đang offline — dữ liệu có thể chưa mới nhất
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    // SafeAreaView already handles top inset; no extra padding needed here.
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
