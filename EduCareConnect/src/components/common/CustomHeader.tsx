import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";

const HEADER_BG = "#2E7D32";
const HEADER_FG = "#FFFFFF";

export function CustomHeader({
  options,
  navigation,
  back,
}: NativeStackHeaderProps) {
  // App.tsx overrides SafeAreaInsetsContext: top=0 when offline (banner consumed it),
  // real inset when online — so this correctly handles both states without double padding.
  const { top } = useSafeAreaInsets();

  let titleNode: React.ReactNode;
  if (typeof options.headerTitle === "function") {
    titleNode = options.headerTitle({
      children: options.title ?? "",
      tintColor: HEADER_FG,
    });
  } else {
    const titleStr =
      (options.headerTitle as string | undefined) ?? options.title ?? "";
    titleNode = (
      <Text style={styles.title} numberOfLines={1}>
        {titleStr}
      </Text>
    );
  }

  const rightNode = options.headerRight
    ? options.headerRight({ tintColor: HEADER_FG, canGoBack: !!back })
    : null;

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <View style={styles.bar}>
        <View style={back ? styles.left : { marginLeft: 12 }}>
          {back ? (
            <Pressable
              onPress={navigation.goBack}
              hitSlop={8}
              style={styles.backBtn}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={HEADER_FG}
              />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.center}>{titleNode}</View>
        <View style={rightNode ? styles.right : { marginRight: 12 }}>
          {rightNode}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: HEADER_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  bar: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  left: {
    width: 48,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  center: {
    flex: 1,
  },
  right: {
    width: 48,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  title: {
    color: HEADER_FG,
    fontWeight: "700",
    fontSize: 17,
  },
  backBtn: {
    padding: 8,
  },
});
