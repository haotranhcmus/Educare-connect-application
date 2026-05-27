import React, { useRef, useEffect, useContext } from "react";
import {
  Animated,
  View,
  ViewStyle,
  StyleSheet,
  Easing,
  Platform,
} from "react-native";
import { useTheme } from "react-native-paper";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

const ShimmerAnim = React.createContext<Animated.Value | null>(null);

interface SkeletonProps {
  children: React.ReactNode;
  /** Một lượt shimmer mất bao lâu (ms). Default 1600 — đủ chậm để cảm giác cao cấp. */
  speed?: number;
}

export function Skeleton({ children, speed = 1600 }: SkeletonProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: speed,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, speed]);

  return <ShimmerAnim.Provider value={anim}>{children}</ShimmerAnim.Provider>;
}

type SkeletonItemProps = ViewStyle & {
  children?: React.ReactNode;
  /** Phạm vi shimmer trượt qua. Default 280 — phủ rộng, cảm giác mềm. */
  shimmerWidth?: number;
};

export function SkeletonItem({
  children,
  shimmerWidth = 280,
  ...styleProps
}: SkeletonItemProps) {
  const anim = useContext(ShimmerAnim);
  const theme = useTheme();

  if (children) {
    return <View style={styleProps as ViewStyle}>{children}</View>;
  }

  const translateX = anim
    ? anim.interpolate({
        inputRange: [0, 1],
        outputRange: [-shimmerWidth, shimmerWidth * 2.5],
      })
    : 0;

  // Refined palette — tương phản thấp, mềm mại theo phong cách Linear / Vercel
  const baseColor = theme.dark ? "#26262B" : "#ECECEF";
  const midColor = theme.dark ? "#2E2E35" : "#F2F2F5";
  const peakColor = theme.dark ? "#38383F" : "#F9F9FB";

  return (
    <View
      style={[
        { overflow: "hidden", backgroundColor: baseColor },
        styleProps as ViewStyle,
      ]}
    >
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: "black" }]}
          />
        }
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}
        >
          <LinearGradient
            colors={[baseColor, midColor, peakColor, midColor, baseColor]}
            locations={[0, 0.35, 0.5, 0.65, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, width: shimmerWidth }}
          />
        </Animated.View>
      </MaskedView>
    </View>
  );
}

/**
 * Card wrapper dùng trong skeleton — match style của list/detail card thật:
 * white surface + 1px hairline border + subtle shadow.
 */
export function SkeletonCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
});
