import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";

interface SentInfoBannerProps {
  status: "sent" | "read";
  sentAt?: string; // write_date when transitioned to sent
  recipientEmail?: string;
  readAt?: string; // timestamp when marked read (if available)
}

export function SentInfoBanner({
  status,
  sentAt,
  recipientEmail,
  readAt,
}: SentInfoBannerProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.banner, { backgroundColor: theme.colors.surfaceVariant }]}
    >
      <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
        ✉ Đã gửi lúc {sentAt || "—"}
      </Text>
      {recipientEmail && (
        <Text variant="bodySmall">Nhận bởi: {recipientEmail}</Text>
      )}

      {status === "read" && (
        <View
          style={[
            styles.readBanner,
            { backgroundColor: "#E8F5E9", marginTop: 8 },
          ]}
        >
          <Text
            variant="bodyMedium"
            style={{ fontWeight: "600", color: "#2E7D32" }}
          >
            ✅ Phụ huynh đã đọc {readAt ? `· ${readAt}` : ""}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  readBanner: {
    padding: 8,
    borderRadius: 6,
  },
});
