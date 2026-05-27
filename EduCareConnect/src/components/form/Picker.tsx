import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Menu, Button, Text, useTheme } from "react-native-paper";

interface PickerProps {
  label: string;
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: (value: any) => void;
}

export function Picker({ label, value, options, onChange }: PickerProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={{ marginBottom: 4 }}>
        {label}
      </Text>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setVisible(true)}
            contentStyle={styles.btnContent}
            labelStyle={
              selected
                ? { color: theme.colors.onSurface, textAlign: "left" }
                : { color: theme.colors.outline, textAlign: "left" }
            }
          >
            {selected?.label || "Chọn..."}
          </Button>
        }
      >
        {options.map((opt) => (
          <Menu.Item
            key={String(opt.value)}
            onPress={() => {
              onChange(opt.value);
              setVisible(false);
            }}
            title={opt.label}
          />
        ))}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  btnContent: { justifyContent: "flex-start" },
});
