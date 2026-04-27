import React, { useState } from "react";
import { View, Platform, StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";

export interface TimeValue {
  hours: number;
  minutes: number;
}

interface TimePickerFieldProps {
  label: string;
  value: TimeValue;
  onChange: (value: TimeValue) => void;
}

export function TimePickerField({
  label,
  value,
  onChange,
}: TimePickerFieldProps) {
  const [show, setShow] = useState(false);

  const date = new Date();
  date.setHours(value.hours, value.minutes, 0, 0);

  const displayLabel = `${String(value.hours).padStart(2, "0")}:${String(value.minutes).padStart(2, "0")}`;

  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={{ marginBottom: 4 }}>
        {label}
      </Text>
      <Button
        mode="outlined"
        onPress={() => setShow(true)}
        icon="clock-outline"
      >
        {displayLabel}
      </Button>
      {show && (
        <DateTimePicker
          value={date}
          mode="time"
          is24Hour
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onValueChange={(_event, selected) => {
            setShow(false);
            if (selected) {
              onChange({
                hours: selected.getHours(),
                minutes: selected.getMinutes(),
              });
            }
          }}
          onDismiss={() => setShow(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginBottom: 16 },
});
