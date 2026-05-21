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
import { queryKeys } from "../api/queryKeys";

export function useStudentIepPlans(studentId: number) {
  return useQuery({
    queryKey: queryKeys.students.iepPlans(studentId),
    queryFn: () => fetchStudentIepPlans(studentId),
    enabled: !!studentId,
  });
}

export function useIepPlanDetail(planId: number) {
  return useQuery({
    queryKey: queryKeys.iepPlans.detail(planId),
    queryFn: () => fetchIepPlanDetail(planId),
    enabled: !!planId,
  });
}

export function useGoalsForPlan(planId: number) {
  return useQuery({
    queryKey: queryKeys.iepGoals.forPlan(planId),
    queryFn: () => fetchGoalsForPlan(planId),
    enabled: !!planId,
  });
}

export function useGoalsByIds(goalIds: number[]) {
  // Sort + join ensures the same set of ids in any order maps to one cache entry.
  const key = goalIds.slice().sort().join(",");
  return useQuery({
    queryKey: queryKeys.iepGoals.byIds(key),
    queryFn: () => fetchGoalsByIds(goalIds),
    enabled: goalIds.length > 0,
  });
}

export function useObjectivesForGoal(goalId: number) {
  return useQuery({
    queryKey: queryKeys.iepObjectives.forGoal(goalId),
    queryFn: () => fetchObjectivesForGoal(goalId),
    enabled: !!goalId,
  });
}

export function useObjectiveDetail(objectiveId: number) {
  return useQuery({
    queryKey: queryKeys.iepObjectives.detail(objectiveId),
    queryFn: () => fetchObjectiveDetail(objectiveId),
    enabled: !!objectiveId,
  });
}

export function useObjectiveResults(objectiveId: number, limit = 10) {
  return useQuery({
    queryKey: queryKeys.iepResults.byObjective(objectiveId, limit),
    queryFn: () => fetchObjectiveResults(objectiveId, limit),
    enabled: !!objectiveId,
  });
}
