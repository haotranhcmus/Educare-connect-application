import React from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { AvatarLabel } from "@components/common/AvatarLabel";

interface ProgressRingAvatarProps {
  uri?: string;
  name: string;
  size?: number;
  progress: number; // 0-100
  ringColor?: string;
  trackColor?: string;
}

export function ProgressRingAvatar({
  uri,
  name,
  size = 44,
  progress,
  ringColor = "#4CAF50",
  trackColor = "rgba(255,255,255,0.25)",
}: ProgressRingAvatarProps) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const strokeDashoffset = circumference * (1 - clampedProgress / 100);

  return (
    <View style={{ width: size, height: size }}>
      {/* SVG ring behind avatar */}
      <Svg
        width={size}
        height={size}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {/* Avatar centered inside ring */}
      <View
        style={{
          position: "absolute",
          top: strokeWidth,
          left: strokeWidth,
          width: size - strokeWidth * 2,
          height: size - strokeWidth * 2,
          borderRadius: (size - strokeWidth * 2) / 2,
          overflow: "hidden",
        }}
      >
        <AvatarLabel uri={uri} name={name} size={size - strokeWidth * 2} />
      </View>
    </View>
  );
}
