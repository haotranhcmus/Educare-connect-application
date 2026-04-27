import React, { useState } from "react";
import { View, Platform, StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { formatDate } from "../../utils/formatters";

interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
}

export function DatePickerField({
  label,
  value,
  onChange,
}: DatePickerFieldProps) {
  const [show, setShow] = useState(false);
  const date = value ? new Date(value + "T00:00:00") : new Date();

  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={{ marginBottom: 4 }}>
        {label}
      </Text>
      <Button mode="outlined" onPress={() => setShow(true)} icon="calendar">
        {formatDate(value)}
      </Button>
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onValueChange={(_event, selected) => {
            setShow(false);
            if (selected) {
              // Use local date to avoid UTC offset shifting the day
              const y = selected.getFullYear();
              const m = String(selected.getMonth() + 1).padStart(2, "0");
              const d = String(selected.getDate()).padStart(2, "0");
              onChange(`${y}-${m}-${d}`);
            }
          }}
          onDismiss={() => setShow(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ container: { marginBottom: 16 } });
