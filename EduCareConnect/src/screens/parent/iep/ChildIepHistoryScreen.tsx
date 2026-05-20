import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { EmptyState } from "../../../components/common/EmptyState";
import { useParentStore } from "../../../store/parentStore";
import { StudentIepTab } from "../../teacher/student/tabs/StudentIepTab";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ParentChildStackParamList } from "../../../navigation/types";

type Props = {
  navigation: NativeStackNavigationProp<
    ParentChildStackParamList,
    "ChildIepHistory"
  >;
};

export function ChildIepHistoryScreen({ navigation }: Props) {
  const theme = useTheme();
  const { selectedStudentId, selectedStudent } = useParentStore();
  const studentName = selectedStudent?.name;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {studentName && (
        <View
          style={[
            styles.subheader,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <MaterialCommunityIcons
            name="account-child-outline"
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginLeft: 6 }}
          >
            {studentName}
          </Text>
        </View>
      )}

      {selectedStudentId ? (
        <StudentIepTab
          studentId={selectedStudentId}
          navigation={navigation}
          detailRouteName="ChildIepPlanDetail"
          objectiveRouteName="ChildIepObjectiveDetail"
        />
      ) : (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="clipboard-text-clock-outline"
            title="Chưa có kỳ IEP nào"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  subheader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyWrap: { flex: 1, justifyContent: "center", paddingHorizontal: 16 },
});
