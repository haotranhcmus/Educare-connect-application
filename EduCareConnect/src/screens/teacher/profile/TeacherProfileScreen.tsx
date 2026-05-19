import React from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Avatar, Text, Divider, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SectionHeader } from "../../../components/common/SectionHeader";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { useMyProfile, useUploadAvatar } from "../../../hooks/useProfile";
import { useAuthStore } from "../../../store/authStore";
import Constants from "expo-constants";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TeacherProfileStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<TeacherProfileStackParamList, "Profile">;

const ROLE_LABELS: Record<string, string> = {
  admin: "Quản trị viên",
  supervisor: "Giám sát",
  teacher: "Giáo viên",
  parent: "Phụ huynh",
};

const ROLE_ICONS: Record<string, string> = {
  admin: "shield-crown",
  supervisor: "account-supervisor",
  teacher: "school",
  parent: "human-male-child",
};

export function TeacherProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const { data: profile, isLoading } = useMyProfile();
  const logout = useAuthStore((s) => s.logout);
  const uploadAvatar = useUploadAvatar();

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => logout() },
    ]);
  };

  const handlePickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Cần quyền truy cập",
        "Vui lòng cho phép truy cập thư viện ảnh.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64 && profile) {
      try {
        await uploadAvatar.mutateAsync({
          base64Image: result.assets[0].base64,
        });
      } catch {
        Alert.alert("Lỗi", "Không thể cập nhật ảnh đại diện.");
      }
    }
  };

  if (isLoading || !profile) return <LoadingOverlay visible />;

  const centerName = Array.isArray(profile.center_id)
    ? profile.center_id[1]
    : "—";
  const filled = profile.current_student_count;
  const maxSlots = profile.max_students;
  const progress = maxSlots > 0 ? filled / maxSlots : 0;
  const progressColor =
    progress >= 1
      ? theme.colors.error
      : progress >= 0.75
        ? "#F57C00"
        : theme.colors.primary;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* ── Hero ─────────────────────────────────────── */}
      <View
        style={[styles.heroCard, { backgroundColor: theme.colors.surface }]}
      >
        {/* ── Avatar with edit button ── */}
        <TouchableOpacity
          onPress={handlePickAvatar}
          activeOpacity={0.8}
          style={styles.avatarWrapper}
        >
          {profile.avatar ? (
            <Avatar.Image
              size={80}
              source={{ uri: `data:image/png;base64,${profile.avatar}` }}
            />
          ) : (
            <Avatar.Icon size={80} icon="account" />
          )}
          <View
            style={[
              styles.cameraOverlay,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            {uploadAvatar.isPending ? (
              <ActivityIndicator size={12} color="#fff" />
            ) : (
              <MaterialCommunityIcons name="camera" size={14} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
        <Text
          variant="titleLarge"
          style={{ fontWeight: "700", textAlign: "center", marginBottom: 6 }}
        >
          {profile.display_name.replace(/\s*\(.*?\)\s*$/, "").trim()}
        </Text>
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name={(ROLE_ICONS[profile.role] || "account") as any}
            size={14}
            color={theme.colors.primary}
          />
          <Text
            variant="labelMedium"
            style={{ color: theme.colors.primary, marginLeft: 4 }}
          >
            {ROLE_LABELS[profile.role] || profile.role}
          </Text>
        </View>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.outline, marginTop: 4 }}
        >
          {centerName}
        </Text>
      </View>

      {/* ── Thông Tin Liên Hệ ─────────────────────────── */}
      <SectionHeader
        icon="card-account-details-outline"
        title="Thông Tin Liên Hệ"
      />
      <View
        style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}
      >
        <InfoRow label="Email" value={profile.email || "Chưa cập nhật"} />
        <InfoRow label="Điện thoại" value={profile.phone || "Chưa cập nhật"} />
      </View>

      {/* ── Thông Tin Chuyên Môn ──────────────────────── */}
      <SectionHeader icon="briefcase-outline" title="Chuyên Môn" />
      <View
        style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}
      >
        <InfoRow
          label="Chứng chỉ / Bằng cấp"
          value={profile.certification || "Chưa cập nhật"}
        />
        <InfoRow
          label="Kinh nghiệm"
          value={
            profile.years_experience
              ? `${profile.years_experience} năm`
              : "Chưa cập nhật"
          }
        />
      </View>

      {/* ── Tài Khoản ─────────────────────────────────── */}
      <SectionHeader icon="cog-outline" title="Tài Khoản" />
      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: theme.colors.surface,
            paddingHorizontal: 0,
            paddingVertical: 0,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate("ChangePassword")}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="key-outline"
            size={22}
            color={theme.colors.onSurface}
            style={styles.actionIcon}
          />
          <Text variant="bodyLarge" style={styles.actionLabel}>
            Đổi mật khẩu
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={theme.colors.outline}
          />
        </TouchableOpacity>
        <Divider style={{ marginHorizontal: 16 }} />
        <TouchableOpacity
          style={styles.actionRow}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="logout"
            size={22}
            color={theme.colors.error}
            style={styles.actionIcon}
          />
          <Text
            variant="bodyLarge"
            style={[styles.actionLabel, { color: theme.colors.error }]}
          >
            Đăng xuất
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={theme.colors.error}
          />
        </TouchableOpacity>
      </View>

      <Text variant="bodySmall" style={styles.version}>
        Phiên bản {Constants.expoConfig?.version || "1.0.0"}
      </Text>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <Text
        variant="labelSmall"
        style={{ color: theme.colors.outline, width: 100 }}
      >
        {label}
      </Text>
      <Text variant="bodySmall" style={{ flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  heroCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 12,
    elevation: 1,
    marginBottom: 16,
  },
  avatar: { marginBottom: 12 },
  avatarWrapper: { marginBottom: 12, position: "relative" },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    marginBottom: 16,
  },
  infoRow: { flexDirection: "row", marginVertical: 3 },
  capacityRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
    gap: 4,
  },
  capacityNum: { fontWeight: "700", lineHeight: 52 },
  capacitySep: { color: "#BDBDBD", paddingBottom: 6 },
  capacityMax: { fontWeight: "600", paddingBottom: 4, color: "#9E9E9E" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  actionIcon: { marginRight: 12 },
  actionLabel: { flex: 1 },
  version: { textAlign: "center", opacity: 0.4, marginTop: 4 },
});
