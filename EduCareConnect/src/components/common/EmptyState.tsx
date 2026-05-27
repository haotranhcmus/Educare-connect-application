import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SvgProps } from "react-native-svg";
import LottieView from "lottie-react-native";

interface EmptyStateProps {
  icon?: string;
  image?: React.FC<SvgProps>;
  lottie?: React.ComponentProps<typeof LottieView>["source"];
  lottieSize?: number;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({
  icon,
  image: ImageComponent,
  lottie,
  lottieSize = 160,
  title,
  description,
  action,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Priority: lottie > image > icon */}
      {lottie ? (
        <LottieView
          source={lottie}
          style={{ width: lottieSize, height: lottieSize, marginBottom: 16 }}
          autoPlay
          loop
        />
      ) : ImageComponent ? (
        <ImageComponent width={160} height={160} style={styles.icon} />
      ) : icon ? (
        <MaterialCommunityIcons
          name={icon as any}
          size={56}
          color={theme.colors.outlineVariant}
          style={styles.icon}
        />
      ) : null}

      <Text
        variant="titleMedium"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {title}
      </Text>
      {description && (
        <Text
          variant="bodyMedium"
          style={[styles.description, { color: theme.colors.outline }]}
        >
          {description}
        </Text>
      )}
      {action && (
        <Button mode="outlined" onPress={action.onPress} style={styles.action}>
          {action.label}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  icon: { marginBottom: 16 },
  description: { marginTop: 8, textAlign: "center" },
  action: { marginTop: 20 },
});
