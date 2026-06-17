import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AvatarLabel } from "@components/common/AvatarLabel";
import { ChildSelectorModal } from "@screens/parent/home/ChildSelectorModal";
import { useMyStudents } from "@hooks/useParent";
import { useParentStore } from "@store/parentStore";
import { toAvatarUrl } from "@api/studentApi";

const G1 = "#2E7D32";
const G2 = "#43A047";

const COLLAPSED_BASE = 56;
const EXPANDED_BASE = 268;

export function useStickyHeaderHeights() {
  const insets = useSafeAreaInsets();
  // `expandedHeight` is kept for callers that destructure it but is no longer
  // visually used — the header is static-collapsed.
  const expandedHeight = insets.top + EXPANDED_BASE;
  const collapsedHeight = insets.top + COLLAPSED_BASE;
  const pullRange = expandedHeight - collapsedHeight;
  return { expandedHeight, collapsedHeight, pullRange };
}

export interface StickyParallaxChildHeaderProps {
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export function StickyParallaxChildHeader({
  showBackButton = false,
  onBackPress,
}: StickyParallaxChildHeaderProps) {
  const insets = useSafeAreaInsets();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const { selectedStudent } = useParentStore();
  const { data: students = [] } = useMyStudents();
  const { collapsedHeight } = useStickyHeaderHeights();

  if (!selectedStudent) {
    return <View style={[styles.fallback, { height: collapsedHeight }]} />;
  }

  const hasMultiple = students.length > 1;

  return (
    <>
      <View style={[styles.container, { height: collapsedHeight }]}>
        <LinearGradient
          colors={[G1, G2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.blob} pointerEvents="none" />
        <View style={styles.topHighlight} pointerEvents="none" />

        <View
          style={[styles.row, { paddingTop: insets.top + 8 }]}
          pointerEvents="box-none"
        >
          {showBackButton ? (
            <TouchableOpacity
              onPress={onBackPress}
              hitSlop={10}
              style={styles.iconBtn}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          ) : // <View style={styles.iconBtnSpacer} />
          null}

          <Pressable
            onPress={() => hasMultiple && setSelectorOpen(true)}
            style={({ pressed }) => [
              styles.pill,
              pressed &&
                hasMultiple && {
                  transform: [{ scale: 0.985 }],
                  backgroundColor: "rgba(255,255,255,0.06)",
                },
            ]}
            android_ripple={
              hasMultiple
                ? { color: "rgba(255,255,255,0.14)", borderless: false }
                : undefined
            }
            disabled={!hasMultiple}
          >
            <View style={styles.avatarRing}>
              <AvatarLabel
                uri={toAvatarUrl(selectedStudent.avatar)}
                name={selectedStudent.name}
                size={32}
              />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.name} numberOfLines={1}>
                {selectedStudent.name}
              </Text>
              {selectedStudent.student_code ? (
                <Text style={styles.code} numberOfLines={1}>
                  {selectedStudent.student_code}
                </Text>
              ) : null}
            </View>
            {hasMultiple ? (
              <View style={styles.swapBtn}>
                <MaterialCommunityIcons
                  name="swap-horizontal"
                  size={14}
                  color="#fff"
                />
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.bottomHairline} pointerEvents="none" />
      </View>

      <ChildSelectorModal
        visible={selectorOpen}
        onClose={() => setSelectorOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: G1,
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 10,
  },
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    overflow: "hidden",
    zIndex: 10,
    elevation: 8,
    shadowColor: "#0E3B14",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  blob: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -60,
    right: -60,
  },
  topHighlight: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
  iconBtnSpacer: { width: 36, height: 36 },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: 22,
  },
  avatarRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  textWrap: { flex: 1, marginLeft: 10 },
  name: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  code: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  swapBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.28)",
  },
  bottomHairline: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.10)",
  },
});
