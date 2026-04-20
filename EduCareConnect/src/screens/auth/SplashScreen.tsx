import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Text, ActivityIndicator, useTheme } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";

import SplashTopCurve from "../../components/svgs/SplashTopCurve";
import SplashBottomCurve from "../../components/svgs/SplashBottomCurve";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export function SplashScreen() {
  const theme = useTheme();

  return (
    <LinearGradient
      colors={[theme.colors.onPrimaryContainer, theme.colors.inversePrimary]}
      style={styles.container}
    >
      {/* --- PHẦN SVG TRANG TRÍ CHÈN Ở ĐÂY --- */}
      <View style={styles.topCurveContainer}>
        <SplashTopCurve />
      </View>

      <View style={styles.bottomCurveContainer}>
        <SplashBottomCurve />
      </View>
      {/* ------------------------------------- */}

      {/* Phần nội dung (Logo, Text) nằm bên dưới sẽ tự động nổi lên trên SVG */}
      <View style={styles.contentWrapper}>
        <View style={styles.logoContainer}>
          <View
            style={[
              styles.logoPlaceholder,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <MaterialCommunityIcons
              name="leaf-circle"
              size={40}
              color={theme.colors.primary}
            />
          </View>
        </View>

        <Text
          variant="headlineSmall"
          style={[styles.title, { color: theme.colors.onPrimary }]}
        >
          Educare Connect
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.subtitle, { color: theme.colors.surface }]}
        >
          Đồng hành cùng trẻ đặc biệt
        </Text>

        <ActivityIndicator
          animating
          size="small"
          color={theme.colors.onPrimary}
          style={styles.loading}
        />
      </View>

      {/* Dấu chấm phân trang (Nếu có) */}
      <View style={styles.dotsContainer}>
        <View
          style={[styles.dot, { backgroundColor: theme.colors.onPrimary }]}
        />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Bỏ justifyContent và alignItems ở container tổng đi để dễ định vị absolute
  },
  topCurveContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    opacity: 0.3, // Bạn có thể chỉnh độ mờ của dải băng tại đây
  },
  bottomCurveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.3,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10, // Đảm bảo nội dung luôn đè lên trên SVG
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 40,
  },
  loading: {
    marginBottom: 8,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 50,
    width: "100%",
    zIndex: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginHorizontal: 4,
  },
});
