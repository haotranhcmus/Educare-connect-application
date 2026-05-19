import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Gradient background for React Navigation headers.
 * Use as: screenOptions={{ headerBackground: () => <GradientHeader /> }}
 *
 * Uses flex: 1 (NOT StyleSheet.absoluteFill) so it correctly fills the
 * React Navigation headerBackground flex container on both iOS and Android.
 */
export function GradientHeader() {
  return (
    <View style={{ flex: 1, overflow: "hidden" }}>
      <LinearGradient
        colors={["#1B5E20", "#2E7D32", "#388E3C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      />
    </View>
  );
}
