import React from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type {
  ParentTimetableStackParamList,
  ParentChildStackParamList,
} from "@navigation/types";
import { SharedSessionDetailScreen } from "@screens/common/SessionDetailScreen";

type TimetableProps = NativeStackScreenProps<ParentTimetableStackParamList, "SessionDetail">;
type ChildProps = NativeStackScreenProps<ParentChildStackParamList, "SessionDetail">;

export function ParentSessionDetailScreen({ route, navigation }: TimetableProps | ChildProps) {
  const { sessionId } = route.params;
  return (
    <SharedSessionDetailScreen
      sessionId={sessionId}
      mode="parent"
      nav={{ goBack: () => navigation.goBack() }}
    />
  );
}
