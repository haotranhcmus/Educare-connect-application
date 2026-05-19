import React from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AvatarLabel } from "../../../components/common/AvatarLabel";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { useMyStudents } from "../../../hooks/useParent";
import { useParentStore } from "../../../store/parentStore";

interface ChildSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

const GENDER_LABELS: Record<string, string> = { male: "Nam", female: "Nữ" };
const G1 = "#2E7D32";
const G2 = "#43A047";
const G_LIGHT = "#E8F5E9";
const G_TEXT = "#1B5E20";

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
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
          {/* ── Drag handle ─────────────────────────────
          <View style={styles.handleWrap}>
            <View
              style={[
                styles.handle,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />
          </View> */}

          {/* ── Gradient header ───────────────────────── */}
          <LinearGradient
            colors={[G1, G2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradHeader}
          >
            {/* Icon bubble */}
            <View style={styles.iconBubble}>
              <MaterialCommunityIcons
                name="account-child-outline"
                size={20}
                color="#fff"
              />
            </View>

            {/* Title */}
            <View style={{ flex: 1 }}>
              <Text style={styles.headerSub}>Danh sách</Text>
              <Text style={styles.headerTitle}>
                Chọn con
                <Text style={styles.headerCount}> ({students.length})</Text>
              </Text>
            </View>

            {/* Close button */}
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <MaterialCommunityIcons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* ── Divider ───────────────────────────────── */}
          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />

          {/* ── Student list ──────────────────────────── */}
          <FlatList
            data={students}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedStudentId;
              const teacherName = Array.isArray(item.assigned_teacher_id)
                ? item.assigned_teacher_id[1]
                : null;

              return (
                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={() => handleSelect(item)}
                  style={styles.cardWrapper}
                >
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: isSelected
                          ? G_LIGHT
                          : theme.colors.surface,
                        borderColor: isSelected
                          ? G1
                          : theme.colors.outlineVariant,
                        borderLeftWidth: isSelected ? 4 : 0,
                      },
                    ]}
                  >
                    {/* Avatar */}
                    <View
                      style={[
                        styles.avatarRing,
                        { borderColor: isSelected ? G1 : "transparent" },
                      ]}
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
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      {/* Name + status */}
                      <View style={styles.nameRow}>
                        <Text
                          style={[
                            styles.studentName,
                            {
                              color: isSelected
                                ? G_TEXT
                                : theme.colors.onSurface,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <StatusBadge status={item.status} size="small" />
                      </View>

                      {/* Sub info row */}
                      <View style={styles.subRow}>
                        {item.gender ? (
                          <View style={styles.subChip}>
                            <MaterialCommunityIcons
                              name={
                                item.gender === "male"
                                  ? "gender-male"
                                  : "gender-female"
                              }
                              size={11}
                              color={isSelected ? G1 : theme.colors.outline}
                            />
                            <Text
                              style={[
                                styles.subChipText,
                                {
                                  color: isSelected ? G1 : theme.colors.outline,
                                },
                              ]}
                            >
                              {GENDER_LABELS[item.gender] ?? item.gender}
                              {item.age ? ` · ${item.age} tuổi` : ""}
                            </Text>
                          </View>
                        ) : null}
                        {teacherName ? (
                          <View style={styles.subChip}>
                            <MaterialCommunityIcons
                              name="account-tie-outline"
                              size={11}
                              color={isSelected ? G1 : theme.colors.outline}
                            />
                            <Text
                              style={[
                                styles.subChipText,
                                {
                                  color: isSelected ? G1 : theme.colors.outline,
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {teacherName}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {/* Right indicator */}
                    {isSelected ? (
                      <View style={styles.checkCircle}>
                        <MaterialCommunityIcons
                          name="check"
                          size={14}
                          color="#fff"
                        />
                      </View>
                    ) : (
                      <View
                        style={[styles.arrowBtn, { backgroundColor: G_LIGHT }]}
                      >
                        <MaterialCommunityIcons
                          name="circle-outline"
                          size={15}
                          color={G1}
                        />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
  },

  // ── Sheet ───────────────────────────────────────────────────
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "75%",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        // shadowColor: "#000",
        // shadowOffset: { width: 0, height: -4 },
        // shadowOpacity: 0.15,
        // shadowRadius: 16,
      },
      android: { elevation: 20 },
    }),
  },

  // ── Handle ──────────────────────────────────────────────────
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },

  // ── Gradient header ─────────────────────────────────────────
  gradHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerSub: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.72)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.1,
  },
  headerCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.72)",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  divider: {
    height: StyleSheet.hairlineWidth,
  },

  // ── List ────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 8,
  },

  // ── Student card ────────────────────────────────────────────
  cardWrapper: {
    borderRadius: 16,
    ...Platform.select({
      ios: {
        // shadowColor: G1,
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.07,
        // shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingRight: 12,
    paddingLeft: 0,
    overflow: "hidden",
  },

  // Selected left stripe
  selectedStripe: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: G1,
    marginRight: 12,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },

  avatarRing: {
    borderRadius: 24,
    borderWidth: 2,
    overflow: "hidden",
    marginLeft: 10,
  },

  // Name row
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
    letterSpacing: 0.1,
  },

  // Sub info
  subRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  subChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  subChipText: {
    fontSize: 11,
    fontWeight: "500",
  },

  // Right indicators
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: G1,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});
