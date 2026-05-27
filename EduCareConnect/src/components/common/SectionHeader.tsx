import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, IconButton, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

interface SectionHeaderProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  action?: {
    label: string;
    onPress: () => void;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  };
}

export function SectionHeader({ icon, title, action }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={theme.colors.primary}
            style={styles.icon}
          />
        )}
        <Text
          variant="titleMedium"
          style={{ color: theme.colors.primary, width: "100%" }}
        >
          {title}
        </Text>
      </View>
      {action && (
        <Text
          variant="labelLarge"
          style={{ color: theme.colors.primary }}
          onPress={action.onPress}
        >
          {action.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 4,
  },
});
