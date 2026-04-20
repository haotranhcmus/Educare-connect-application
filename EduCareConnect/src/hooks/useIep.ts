import { useQuery } from "@tanstack/react-query";
import { fetchStudentIepPlans } from "../api/iepApi";

export function useStudentIepPlans(studentId: number) {
  return useQuery({
    queryKey: ["iep-plans", "student", studentId],
    queryFn: () => fetchStudentIepPlans(studentId),
    enabled: !!studentId,
  });
}