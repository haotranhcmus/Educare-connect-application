import React from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SessionStackParamList } from "@navigation/types";
import { SharedSessionDetailScreen } from "@screens/common/SessionDetailScreen";

type Props = NativeStackScreenProps<SessionStackParamList, "SessionDetail">;

export function SessionDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  return (
    <SharedSessionDetailScreen
      sessionId={sessionId}
      mode="teacher"
      nav={{
        goBack: () => navigation.goBack(),
        toEval: (id) => navigation.navigate("EvalObjective", { sessionId: id, objectiveIndex: 0 }),
        toEdit: (id) => navigation.navigate("SessionEdit", { sessionId: id }),
        toReport: (reportId) => navigation.navigate("ReportDetail", { reportId }),
        toCreateReport: (id) => navigation.navigate("ReportCreate", { sessionId: id }),
      }}
    />
  );
}
