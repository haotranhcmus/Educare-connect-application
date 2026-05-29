import React from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SessionStackParamList } from "@navigation/types";
import { SharedSessionDetailScreen } from "@screens/common/SessionDetailScreen";
import { useRequireOnline } from "@hooks/useRequireOnline";

type Props = NativeStackScreenProps<SessionStackParamList, "SessionDetail">;

export function SessionDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const requireOnline = useRequireOnline();
  return (
    <SharedSessionDetailScreen
      sessionId={sessionId}
      mode="teacher"
      nav={{
        goBack: () => navigation.goBack(),
        toEval: (id) => navigation.navigate("EvalObjective", { sessionId: id, objectiveIndex: 0 }),
        // Editing and report creation hit the network — gate behind online check.
        toEdit: (id) =>
          requireOnline(() => navigation.navigate("SessionEdit", { sessionId: id })),
        toReport: (reportId) => navigation.navigate("ReportDetail", { reportId }),
        toCreateReport: (id) =>
          requireOnline(() =>
            navigation.navigate("ReportCreate", { sessionId: id }),
          ),
      }}
    />
  );
}
