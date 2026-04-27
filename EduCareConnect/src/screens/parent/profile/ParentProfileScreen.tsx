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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMyProfile, useUploadAvatar } from "../../../hooks/useProfile";
import { useMyStudent } from "../../../hooks/useParent";
import { useAuthStore } from "../../../store/authStore";
import Constants from "expo-constants";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ParentProfileStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<ParentProfileStackParamList, "Profile">;

export function ParentProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading: loadingProfile } = useMyProfile();
  const { data: student, isLoading: loadingStudent } = useMyStudent();
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

  if (loadingProfile || loadingStudent) return <LoadingOverlay visible />;

  const centerName = Array.isArray(student?.center_id)
    ? student!.center_id[1]
    : "";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 8 }]}
    >
      {/* ── Hero ─────────────────────────────────────── */}
      <View
        style={[styles.heroCard, { backgroundColor: theme.colors.surface }]}
      >
        <TouchableOpacity
          onPress={handlePickAvatar}
          activeOpacity={0.8}
          style={styles.avatarWrapper}
        >
          {profile?.avatar ? (
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
          {profile?.display_name || "—"}
        </Text>
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name="human-male-child"
            size={14}
            color={theme.colors.primary}
          />
          <Text
            variant="labelMedium"
            style={{ color: theme.colors.primary, marginLeft: 4 }}
          >
            Phụ huynh
          </Text>
        </View>
        {centerName ? (
          <View style={styles.centerRow}>
            <MaterialCommunityIcons
              name="domain"
              size={14}
              color={theme.colors.outline}
            />
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.outline, marginLeft: 4 }}
            >
              {centerName}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Thông Tin Liên Hệ ─────────────────────────── */}
      <SectionHeader
        icon="card-account-details-outline"
        title="Thông Tin Liên Hệ"
      />
      <View
        style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}
      >
        <InfoRow label="Email" value={profile?.email || "—"} />
        <InfoRow label="Điện thoại" value={profile?.phone || "—"} />
      </View>

      {/* ── Con tôi ───────────────────────────────────── */}
      {student && (
        <>
          <SectionHeader icon="baby-face-outline" title="Con tôi" />
          <View
            style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}
          >
            <InfoRow label="Họ và tên" value={student.name} />
            <InfoRow label="Mã học sinh" value={student.student_code} />
            {centerName ? (
              <InfoRow label="Trung tâm" value={centerName} />
            ) : null}
            <InfoRow
              label="Giáo viên phụ trách"
              value={
                Array.isArray(student.assigned_teacher_id)
                  ? student.assigned_teacher_id[1]
                  : "—"
              }
            />
          </View>
        </>
      )}

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
        style={{ color: theme.colors.outline, width: 140 }}
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
  container: { padding: 16, paddingBottom: 40, paddingTop: 0 },
  heroCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 12,
    elevation: 1,
    marginBottom: 16,
  },
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
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    marginBottom: 16,
  },
  infoRow: { flexDirection: "row", marginVertical: 3 },
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
