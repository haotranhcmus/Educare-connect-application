import React, { useMemo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { AVATAR_PALETTE } from "../../theme/decorativeColors";

interface AvatarLabelProps {
  uri?: string;
  name: string;
  size?: number;
  backgroundColor?: string;
}

/** Two-letter initials from a person's name. Exported for reuse. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name[0] || "?").toUpperCase();
}

/** Deterministic color for an avatar background based on name. Exported for reuse. */
export function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
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
