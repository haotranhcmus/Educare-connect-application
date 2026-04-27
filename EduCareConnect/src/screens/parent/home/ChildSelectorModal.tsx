import React from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AvatarLabel } from "../../../components/common/AvatarLabel";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { useMyStudents } from "../../../hooks/useParent";
import { useParentStore } from "../../../store/parentStore";

interface ChildSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

const GENDER_LABELS: Record<string, string> = { male: "Nam", female: "Nữ" };

export function ChildSelectorModal({
  visible,
  onClose,
}: ChildSelectorModalProps) {
  const theme = useTheme();
  const { data: students = [] } = useMyStudents();
  const { selectedStudentId, setSelectedStudent } = useParentStore();

  function handleSelect(student: any) {
    setSelectedStudent(student);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Sheet */}
      <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
        {/* Handle */}
        <View
          style={[
            styles.handle,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />

        {/* Title */}
        <View style={styles.header}>
          <Text
            variant="titleMedium"
            style={{ fontWeight: "700", color: theme.colors.onSurface }}
          >
            Chọn con
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name="close"
              size={22}
              color={theme.colors.outline}
            />
          </TouchableOpacity>
        </View>

        <FlatList
          data={students}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedStudentId;
            const teacherName = Array.isArray(item.assigned_teacher_id)
              ? item.assigned_teacher_id[1]
              : null;
            return (
              <TouchableOpacity
                style={[
                  styles.studentRow,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primaryContainer
                      : theme.colors.surfaceVariant,
                  },
                ]}
                activeOpacity={0.75}
                onPress={() => handleSelect(item)}
              >
                <AvatarLabel
                  uri={
                    item.avatar
                      ? `data:image/png;base64,${item.avatar}`
                      : undefined
                  }
                  name={item.name}
                  size={44}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text
                      variant="titleSmall"
                      style={{
                        color: theme.colors.onSurface,
                        fontWeight: "700",
                      }}
                    >
                      {item.name}
                    </Text>
                    <StatusBadge status={item.status} />
                  </View>
                  {teacherName && (
                    <View style={styles.metaRow}>
                      <MaterialCommunityIcons
                        name="account-tie-outline"
                        size={12}
                        color={theme.colors.outline}
                      />
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.outline, marginLeft: 4 }}
                      >
                        {teacherName}
                      </Text>
                    </View>
                  )}
                  {item.gender && (
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.outline }}
                    >
                      {GENDER_LABELS[item.gender] ?? item.gender}
                      {item.age ? ` · ${item.age} tuổi` : ""}
                    </Text>
                  )}
                </View>
                {isSelected && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={22}
                    color={theme.colors.primary}
                  />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingTop: 12,
    elevation: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
});
