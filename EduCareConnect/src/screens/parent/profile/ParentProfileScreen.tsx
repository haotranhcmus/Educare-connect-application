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
import { useMyStudent } from "../../../hooks/useParent";
import { useAuthStore } from "../../../store/authStore";
import Constants from "expo-constants";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ParentProfileStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<ParentProfileStackParamList, "Profile">;

export function ParentProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const { data: profile, isLoading: loadingProfile } = useMyProfile();
  const { data: student, isLoading: loadingStudent } = useMyStudent();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => logout() },
    ]);
  };

  if (loadingProfile || loadingStudent) return <LoadingOverlay visible />;

  const centerName = Array.isArray(student?.center_id)
    ? student!.center_id[1]
    : "";

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
          {profile?.avatar ? (
            <Avatar.Image
              size={88}
              source={{ uri: `data:image/png;base64,${profile.avatar}` }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Icon size={88} icon="account" style={styles.avatar} />
          )}
          <Text variant="headlineSmall" style={styles.heroName}>
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
            <Text variant="bodySmall" style={styles.centerText}>
              🏫 {centerName}
            </Text>
          ) : null}
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
            value={profile?.email || "—"}
          />
          <InfoRow
            icon="phone-outline"
            label="Điện thoại"
            value={profile?.phone || "—"}
          />
        </Card.Content>
      </Card>

      {/* ── Con tôi ───────────────────────────────────── */}
      {student && (
        <Card style={styles.sectionCard} mode="elevated">
          <Card.Title
            title="Con tôi"
            titleStyle={styles.cardTitle}
            left={(p) => (
              <MaterialCommunityIcons
                name="baby-face-outline"
                size={p.size}
                color={theme.colors.primary}
              />
            )}
          />
          <Card.Content>
            <InfoRow
              icon="account-circle-outline"
              label="Họ và tên"
              value={student.name}
            />
            <InfoRow
              icon="identifier"
              label="Mã học sinh"
              value={student.student_code}
            />
            {centerName ? (
              <InfoRow icon="domain" label="Trung tâm" value={centerName} />
            ) : null}
            <InfoRow
              icon="account-school-outline"
              label="Giáo viên phụ trách"
              value={
                Array.isArray(student.assigned_teacher_id)
                  ? student.assigned_teacher_id[1]
                  : "—"
              }
            />
          </Card.Content>
        </Card>
      )}

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
