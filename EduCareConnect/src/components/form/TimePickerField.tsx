import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Text as RNText,
  Modal,
} from "react-native";
import Animated, {
  useAnimatedRef,
  useScrollViewOffset,
  useAnimatedStyle,
  interpolate,
  interpolateColor,
  Extrapolation,
  scrollTo,
  runOnUI,
  type SharedValue,
} from "react-native-reanimated";
import { TextInput, useTheme, Button } from "react-native-paper";

export interface TimeValue {
  hours: number;
  minutes: number;
}

// ── Constants ────────────────────────────────────────────────────
const ITEM_H = 54;
const VISIBLE = 5; // odd number → center item = selected
const COL_H = ITEM_H * VISIBLE;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

// ── Single drum item — animated via shared scroll value ──────────
interface DrumItemProps {
  value: number;
  index: number;
  scrollY: SharedValue<number>;
  onPress: () => void;
  primaryColor: string;
  mutedColor: string;
}

function DrumItem({
  value,
  index,
  scrollY,
  onPress,
  primaryColor,
  mutedColor,
}: DrumItemProps) {
  const animStyle = useAnimatedStyle(() => {
    const dist = Math.abs(index - scrollY.value / ITEM_H);

    const scale = interpolate(
      dist,
      [0, 0.4, 1.2, 2],
      [1.3, 1.1, 0.82, 0.65],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      dist,
      [0, 0.4, 1.2, 2],
      [1, 0.9, 0.45, 0.2],
      Extrapolation.CLAMP,
    );
    const color = interpolateColor(dist, [0, 0.8], [primaryColor, mutedColor]);

    return { transform: [{ scale }], opacity, color };
  });

  return (
    <TouchableOpacity
      style={styles.drumItem}
      onPress={onPress}
      activeOpacity={0.65}
    >
      <Animated.Text style={[styles.drumText, animStyle]}>
        {String(value).padStart(2, "0")}
      </Animated.Text>
    </TouchableOpacity>
  );
}

// ── Drum column ──────────────────────────────────────────────────
interface DrumColumnProps {
  values: number[];
  selected: number;
  onSelect: (v: number) => void;
}

function DrumColumn({ values, selected, onSelect }: DrumColumnProps) {
  const theme = useTheme();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useScrollViewOffset(scrollRef);
  const initialIdx = Math.max(0, values.indexOf(selected));

  // Scroll to selected item once the layout is ready
  const onLayout = useCallback(() => {
    runOnUI(() => {
      scrollTo(scrollRef, 0, initialIdx * ITEM_H, false);
    })();
  }, [scrollRef, initialIdx]);

  // After momentum ends, snap state to the settled index
  const onMomentumEnd = useCallback(
    (e: any) => {
      const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
      const clamped = Math.max(0, Math.min(values.length - 1, idx));
      onSelect(values[clamped]);
    },
    [values, onSelect],
  );

  const handlePress = useCallback(
    (v: number, i: number) => {
      onSelect(v);
      runOnUI(() => {
        scrollTo(scrollRef, 0, i * ITEM_H, true);
      })();
    },
    [scrollRef, onSelect],
  );

  return (
    <View style={styles.drumWrap}>
      <Animated.ScrollView
        ref={scrollRef}
        onLayout={onLayout}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
      >
        {values.map((v, i) => (
          <DrumItem
            key={v}
            value={v}
            index={i}
            scrollY={scrollY}
            onPress={() => handlePress(v, i)}
            primaryColor={theme.colors.primary}
            mutedColor={theme.colors.onSurfaceVariant}
          />
        ))}
      </Animated.ScrollView>

      {/* Fixed center indicator — visually marks the selected slot */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.centerWrap]}
      >
        <View
          style={[
            styles.centerBar,
            {
              backgroundColor: theme.colors.primary + "14",
              borderColor: theme.colors.primary + "50",
            },
          ]}
        />
      </View>
    </View>
  );
}

// ── TimePickerField ──────────────────────────────────────────────
interface TimePickerFieldProps {
  label: string;
  value: TimeValue;
  onChange: (v: TimeValue) => void;
  error?: boolean;
}

export function TimePickerField({
  label,
  value,
  onChange,
  error,
}: TimePickerFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [pendingH, setPendingH] = useState(value.hours);
  const [pendingM, setPendingM] = useState(value.minutes);

  const displayValue = `${String(value.hours).padStart(2, "0")}:${String(value.minutes).padStart(2, "0")}`;

  const onOpen = () => {
    setPendingH(value.hours);
    setPendingM(value.minutes);
    setOpen(true);
  };

  const onConfirm = () => {
    onChange({ hours: pendingH, minutes: pendingM });
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onOpen} activeOpacity={0.8}>
        <View pointerEvents="none">
          <TextInput
            label={label}
            value={displayValue}
            error={error}
            mode="outlined"
            dense
            editable={false}
            right={<TextInput.Icon icon="clock-outline" />}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)} />
          <View
            style={[styles.sheet, { backgroundColor: theme.colors.surface }]}
          >
            <View style={styles.handle} />

            <RNText
              style={[
                styles.sheetTitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {label}
            </RNText>

            <View style={styles.drumRow}>
              {/* Hours column is re-keyed when modal opens so it mounts fresh */}
              <DrumColumn
                key={`h-${open}`}
                values={HOURS}
                selected={pendingH}
                onSelect={setPendingH}
              />
              <RNText style={[styles.colon, { color: theme.colors.primary }]}>
                :
              </RNText>
              <DrumColumn
                key={`m-${open}`}
                values={MINUTES}
                selected={pendingM}
                onSelect={setPendingM}
              />
            </View>

            <View style={styles.btnRow}>
              <Button
                mode="outlined"
                onPress={() => setOpen(false)}
                style={styles.btn}
              >
                Hủy
              </Button>
              <Button mode="contained" onPress={onConfirm} style={styles.btn}>
                Xác nhận
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginBottom: 16 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
    elevation: 10,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ddd",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  // Drum
  drumRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  colon: {
    fontSize: 36,
    fontWeight: "800",
    marginHorizontal: 10,
    marginBottom: 4,
  },
  drumWrap: {
    height: COL_H,
    width: 90,
    overflow: "hidden",
  },
  drumItem: {
    height: ITEM_H,
    alignItems: "center",
    justifyContent: "center",
  },
  drumText: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  centerWrap: { justifyContent: "center" },
  centerBar: {
    height: ITEM_H,
    borderRadius: 10,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    marginHorizontal: 4,
  },
  // Buttons
  btnRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    paddingVertical: 24,
  },
  btn: { flex: 1, borderRadius: 10 },
});
