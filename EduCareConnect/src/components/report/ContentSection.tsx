import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";

interface ContentSectionProps {
  title: string;
  content: string | false;
  icon?: string;
}

export function ContentSection({ title, content, icon }: ContentSectionProps) {
  if (!content) return null; // Hide empty sections

  return (
    <View style={styles.section}>
      <Text variant="titleSmall" style={styles.title}>
        {icon ? `${icon} ` : ""}
        {title}
      </Text>
      <Text variant="bodyMedium" style={styles.content}>
        {content}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 16 },
  title: { fontWeight: "600", marginBottom: 4 },
  content: { lineHeight: 22 },
});
