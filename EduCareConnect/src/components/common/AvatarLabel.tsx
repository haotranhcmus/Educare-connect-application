import React, { useMemo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

interface AvatarLabelProps {
  uri?: string;
  name: string;
  size?: number;
  backgroundColor?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name[0] || "?").toUpperCase();
}

function hashColor(name: string): string {
  const colors = [
    "#2E7D32",
    "#1565C0",
    "#6A1B9A",
    "#C62828",
    "#00838F",
    "#EF6C00",
    "#4527A0",
    "#AD1457",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function AvatarLabel({
  uri,
  name,
  size = 40,
  backgroundColor,
}: AvatarLabelProps) {
  const bgColor = useMemo(
    () => backgroundColor || hashColor(name),
    [backgroundColor, name],
  );
  const initials = useMemo(() => getInitials(name), [name]);
  const fontSize = size * 0.38;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize, color: "#FFFFFF" }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    resizeMode: "cover",
  },
  initials: {
    fontWeight: "700",
  },
});
