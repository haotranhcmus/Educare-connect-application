import React from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Avatar, Text, Card, Divider, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LoadingOverlay } from "../../../components/common/LoadingOverlay";
import { useMyProfile } from "../../../hooks/useProfile";
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

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => logout() },
    ]);
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
      style={{
        flex: 1,
        backgroundColor: theme.colors.surfaceVariant ?? theme.colors.background,
      }}
      contentContainerStyle={styles.container}
    >
      {/* ── Hero Card ─────────────────────────────────── */}
      <Card style={styles.heroCard} mode="elevated">
        <Card.Content style={styles.heroContent}>
          {profile.avatar ? (
            <Avatar.Image
              size={88}
              source={{ uri: `data:image/png;base64,${profile.avatar}` }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Icon size={88} icon="account" style={styles.avatar} />
          )}
          <Text variant="headlineSmall" style={styles.heroName}>
            {profile.display_name}
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
          <Text variant="bodySmall" style={styles.centerText}>
            🏫 {centerName}
          </Text>
        </Card.Content>
      </Card>

      {/* ── Thông Tin Liên Hệ ─────────────────────────── */}
      <Card style={styles.sectionCard} mode="elevated">
        <Card.Title
          title="Thông tin liên hệ"
          titleStyle={styles.cardTitle}
          left={(p) => (
            <MaterialCommunityIcons
              name="card-account-details-outline"
              size={p.size}
              color={theme.colors.primary}
            />
          )}
        />
        <Card.Content>
          <InfoRow
            icon="email-outline"
            label="Email"
            value={profile.email || "—"}
          />
          <InfoRow
            icon="phone-outline"
            label="Điện thoại"
            value={profile.phone || "—"}
          />
        </Card.Content>
      </Card>

      {/* ── Thông Tin Chuyên Môn ──────────────────────── */}
      <Card style={styles.sectionCard} mode="elevated">
        <Card.Title
          title="Chuyên môn"
          titleStyle={styles.cardTitle}
          left={(p) => (
            <MaterialCommunityIcons
              name="briefcase-outline"
              size={p.size}
              color={theme.colors.primary}
            />
          )}
        />
        <Card.Content>
          <InfoRow
            icon="certificate-outline"
            label="Chứng chỉ / Bằng cấp"
            value={profile.certification || "—"}
          />
          <InfoRow
            icon="clock-outline"
            label="Kinh nghiệm"
            value={`${profile.years_experience ?? 0} năm`}
          />
        </Card.Content>
      </Card>

      {/* ── Quản Lý Học Sinh ──────────────────────────── */}
      <Card style={styles.sectionCard} mode="elevated">
        <Card.Title
          title="Quản lý học sinh"
          titleStyle={styles.cardTitle}
          left={(p) => (
            <MaterialCommunityIcons
              name="account-group-outline"
              size={p.size}
              color={theme.colors.primary}
            />
          )}
        />
        <Card.Content>
          <View style={styles.capacityRow}>
            <Text
              variant="displaySmall"
              style={[styles.capacityNum, { color: theme.colors.primary }]}
            >
              {filled}
            </Text>
            <Text variant="headlineMedium" style={styles.capacitySep}>
              /
            </Text>
            <Text variant="titleLarge" style={styles.capacityMax}>
              {maxSlots}
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.capacityUnit, { color: theme.colors.outline }]}
            >
              học sinh
            </Text>
          </View>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(progress * 100, 100)}%`,
                    backgroundColor: progressColor,
                  },
                ]}
              />
            </View>
            <Text
              variant="labelSmall"
              style={{
                color: progressColor,
                fontWeight: "700",
                minWidth: 32,
                textAlign: "right",
              }}
            >
              {Math.round(progress * 100)}%
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* ── Hành Động ─────────────────────────────────── */}
      <Card style={styles.sectionCard} mode="elevated">
        <Card.Content style={{ paddingHorizontal: 0 }}>
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
        </Card.Content>
      </Card>

      <Text variant="bodySmall" style={styles.version}>
        Phiên bản {Constants.expoConfig?.version || "1.0.0"}
      </Text>
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
        size={18}
        color={theme.colors.primary}
        style={styles.infoIcon}
      />
      <View style={{ flex: 1 }}>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.outline, marginBottom: 1 }}
        >
          {label}
        </Text>
        <Text variant="bodyMedium" style={{ fontWeight: "500" }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, gap: 12 },
  heroCard: { borderRadius: 20 },
  heroContent: { alignItems: "center", paddingVertical: 24 },
  avatar: { marginBottom: 12 },
  heroName: { fontWeight: "700", textAlign: "center", marginBottom: 8 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 6,
  },
  centerText: { color: "#757575" },
  sectionCard: { borderRadius: 16 },
  cardTitle: { fontWeight: "700", fontSize: 15 },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  infoIcon: { marginRight: 12, marginTop: 2 },
  capacityRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
    gap: 4,
  },
  capacityNum: { fontWeight: "700", lineHeight: 52 },
  capacitySep: { color: "#BDBDBD", paddingBottom: 6 },
  capacityMax: { fontWeight: "600", paddingBottom: 4, color: "#9E9E9E" },
  capacityUnit: { paddingBottom: 4, marginLeft: 4 },
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
