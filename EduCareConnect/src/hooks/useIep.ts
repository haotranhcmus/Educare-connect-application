import { useQuery } from "@tanstack/react-query";
import {
  fetchStudentIepPlans,
  fetchIepPlanDetail,
  fetchGoalsForPlan,
  fetchGoalsByIds,
  fetchObjectivesForGoal,
  fetchObjectiveDetail,
  fetchObjectiveResults,
} from "../api/iepApi";

export function useStudentIepPlans(studentId: number) {
  return useQuery({
    queryKey: ["iep-plans", "student", studentId],
    queryFn: () => fetchStudentIepPlans(studentId),
    enabled: !!studentId,
  });
}

export function useIepPlanDetail(planId: number) {
  return useQuery({
    queryKey: ["iep-plans", "detail", planId],
    queryFn: () => fetchIepPlanDetail(planId),
    enabled: !!planId,
  });
}

export function useGoalsForPlan(planId: number) {
  return useQuery({
    queryKey: ["iep-goals", "plan", planId],
    queryFn: () => fetchGoalsForPlan(planId),
    enabled: !!planId,
  });
}

export function useGoalsByIds(goalIds: number[]) {
  const key = goalIds.slice().sort().join(",");
  return useQuery({
    queryKey: ["iep-goals", "by-ids", key],
    queryFn: () => fetchGoalsByIds(goalIds),
    enabled: goalIds.length > 0,
  });
}

export function useObjectivesForGoal(goalId: number) {
  return useQuery({
    queryKey: ["iep-objectives", "goal", goalId],
    queryFn: () => fetchObjectivesForGoal(goalId),
    enabled: !!goalId,
  });
}

export function useObjectiveDetail(objectiveId: number) {
  return useQuery({
    queryKey: ["iep-objectives", "detail", objectiveId],
    queryFn: () => fetchObjectiveDetail(objectiveId),
    enabled: !!objectiveId,
  });
}

export function useObjectiveResults(objectiveId: number, limit = 10) {
  return useQuery({
    queryKey: ["iep-results", "objective", objectiveId, limit],
    queryFn: () => fetchObjectiveResults(objectiveId, limit),
    enabled: !!objectiveId,
  });
}
