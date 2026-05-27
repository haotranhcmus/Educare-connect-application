import React from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { toast } from "@utils/toast";
import { Avatar, Text, Divider, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LoadingOverlay } from "@components/common/LoadingOverlay";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMyProfile, useUploadAvatar } from "@hooks/useProfile";
import { useAuthStore } from "@store/authStore";
import Constants from "expo-constants";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "@navigation/types";

type Props = NativeStackScreenProps<ProfileStackParamList, "Profile">;

const AVATAR_SIZE = 96;
const BANNER_HEIGHT = 190;
const GRADIENT: [string, string] = ["#2E7D32", "#66BB6A"];

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
  const insets = useSafeAreaInsets();
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
      toast.info("Cần cấp quyền thư viện ảnh trong cài đặt");
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
        toast.error("Không thể cập nhật ảnh đại diện");
      }
    }
  };

  if (isLoading || !profile) return <LoadingOverlay visible />;

  const centerName = Array.isArray(profile.center_id)
    ? profile.center_id[1]
    : "—";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* ── Banner + Avatar Hero ── */}
      <View>
        <LinearGradient
          colors={GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.banner, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <Text style={styles.bannerLabel}>HỒ SƠ CÁ NHÂN</Text>
        </LinearGradient>

        <View style={styles.avatarFloat}>
          <TouchableOpacity
            onPress={handlePickAvatar}
            activeOpacity={0.85}
            style={styles.avatarTouchable}
          >
            <View style={styles.avatarRing}>
              {profile.avatar ? (
                <Avatar.Image
                  size={AVATAR_SIZE}
                  source={{ uri: `data:image/png;base64,${profile.avatar}` }}
                />
              ) : (
                <Avatar.Icon size={AVATAR_SIZE} icon="account" />
              )}
            </View>
            <View style={styles.cameraBtn}>
              {uploadAvatar.isPending ? (
                <ActivityIndicator size={12} color="#fff" />
              ) : (
                <MaterialCommunityIcons name="camera" size={14} color="#fff" />
              )}
            </View>
          </TouchableOpacity>

          <Text variant="headlineSmall" style={styles.displayName}>
            {profile.display_name.replace(/\s*\(.*?\)\s*$/, "").trim()}
          </Text>

          <View
            style={[
              styles.rolePill,
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
              style={{
                color: theme.colors.primary,
                marginLeft: 4,
                fontWeight: "600",
              }}
            >
              {ROLE_LABELS[profile.role] || profile.role}
            </Text>
          </View>

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
        </View>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        {/* Contact */}
        <Text style={[styles.sectionLabel, { color: theme.colors.outline }]}>
          THÔNG TIN LIÊN HỆ
        </Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <InfoRow
            icon="email-outline"
            label="Email"
            value={profile.email || "Chưa cập nhật"}
          />
          <Divider style={{ marginLeft: 48 }} />
          <InfoRow
            icon="phone-outline"
            label="Điện thoại"
            value={profile.phone || "Chưa cập nhật"}
          />
        </View>

        {/* Specialty */}
        <Text style={[styles.sectionLabel, { color: theme.colors.outline }]}>
          CHUYÊN MÔN
        </Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <InfoRow
            icon="certificate-outline"
            label="Chứng chỉ / Bằng cấp"
            value={profile.certification || "Chưa cập nhật"}
          />
          <Divider style={{ marginLeft: 48 }} />
          <InfoRow
            icon="briefcase-outline"
            label="Kinh nghiệm"
            value={
              profile.years_experience
                ? `${profile.years_experience} năm`
                : "Chưa cập nhật"
            }
          />
        </View>

        {/* Account */}
        <Text style={[styles.sectionLabel, { color: theme.colors.outline }]}>
          TÀI KHOẢN
        </Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate("ChangePassword")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIconBox,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <MaterialCommunityIcons
                name="key-outline"
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <Text variant="bodyLarge" style={styles.actionLabel}>
              Đổi mật khẩu
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={theme.colors.outline}
            />
          </TouchableOpacity>
          <Divider style={{ marginLeft: 64 }} />
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIconBox,
                { backgroundColor: theme.colors.errorContainer },
              ]}
            >
              <MaterialCommunityIcons
                name="logout"
                size={20}
                color={theme.colors.error}
              />
            </View>
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
      </View>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons
        name={icon as any}
        size={20}
        color={theme.colors.primary}
        style={styles.infoIcon}
      />
      <View style={styles.infoContent}>
        <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
          {label}
        </Text>
        <Text variant="bodyMedium" style={{ fontWeight: "500", marginTop: 1 }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: BANNER_HEIGHT,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  decorCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -60,
    right: -50,
  },
  decorCircle2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -30,
    left: -30,
  },
  bannerLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2.5,
  },
  avatarFloat: {
    alignItems: "center",
    marginTop: -(AVATAR_SIZE / 2 + 4),
    paddingBottom: 16,
  },
  avatarTouchable: { position: "relative" },
  avatarRing: {
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  cameraBtn: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: GRADIENT[1],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  displayName: {
    fontWeight: "700",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 6,
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 6,
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  content: { paddingHorizontal: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  infoIcon: { marginRight: 12 },
  infoContent: { flex: 1 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  actionLabel: { flex: 1 },
  version: { textAlign: "center", opacity: 0.4, marginTop: 28 },
});
