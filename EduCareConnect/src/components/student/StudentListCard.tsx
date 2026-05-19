import React, { useRef } from "react";
import { Animated, Pressable, View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AvatarLabel } from "../common/AvatarLabel";
import type { StudentListItem } from "../../types";

interface StudentListCardProps {
  student: StudentListItem;
  onPress: (studentId: number) => void;
}

/** Study duration from enrollment_date to today (e.g. "2 năm 7 tháng") */
function studyDuration(enrollmentDate?: string): string | null {
  if (!enrollmentDate) return null;
  const enrolled = new Date(enrollmentDate);
  const today = new Date();
  const totalDays = Math.floor(
    (today.getTime() - enrolled.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (totalDays < 1) return "Mới nhập học";
  const years = Math.floor(totalDays / 365);
  const remainingDays = totalDays - years * 365;
  const months = Math.floor(remainingDays / 30);
  if (years > 0 && months > 0) return `${years} năm ${months} tháng`;
  if (years > 0) return `${years} năm`;
  if (months > 0) return `${months} tháng`;
  return `${totalDays} ngày`;
}

/** Age in years from date_of_birth */
function calcAge(dob?: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age >= 0 ? age : null;
}

function StudentListCardImpl({ student, onPress }: StudentListCardProps) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const age = calcAge(student.date_of_birth);
  const duration = studyDuration(student.enrollment_date);
  const hasNickname = Boolean(student.nickname);

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.975,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();

  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();

  return (
    <Pressable
      onPress={() => onPress(student.id)}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
            transform: [{ scale }],
          },
        ]}
      >
        {/* Avatar */}
        <View style={[styles.avatarWrap, { borderColor: `${theme.colors.primary}22` }]}>
          <AvatarLabel uri={student.avatar_url} name={student.name} size={52} />
        </View>

        {/* Info block */}
        <View style={styles.info}>
          {/* Nickname (bold, large) OR name only */}
          {hasNickname ? (
            <>
              <Text
                style={[styles.nickname, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {student.nickname}
              </Text>
              <Text
                style={[styles.fullName, { color: theme.colors.onSurfaceVariant }]}
                numberOfLines={1}
              >
                {student.name}
              </Text>
            </>
          ) : (
            <Text
              style={[styles.nickname, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {student.name}
            </Text>
          )}

          {/* Metadata badges */}
          <View style={styles.badgeRow}>
            {age !== null && (
              <View style={[styles.badge, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[styles.badgeText, { color: theme.colors.onSurfaceVariant }]}>
                  {age} tuổi
                </Text>
              </View>
            )}
            {duration && (
              <View style={[styles.badge, { backgroundColor: `${theme.colors.primary}12` }]}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={10}
                  color={theme.colors.primary}
                />
                <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
                  {duration}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Chevron */}
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={theme.colors.outline}
        />
      </Animated.View>
    </Pressable>
  );
}

export const StudentListCard = React.memo(StudentListCardImpl);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  avatarWrap: {
    borderRadius: 30,
    borderWidth: 2,
    overflow: "hidden",
  },
  info: { flex: 1, gap: 5 },
  nickname: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  fullName: {
    fontSize: 13,
    fontWeight: "400",
    marginTop: -3,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});
