import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitEvaluation, ResultInput } from "../api/evalApi";
import { queryKeys } from "../api/queryKeys";

export function useSubmitEval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      results,
    }: {
      sessionId: number;
      results: ResultInput[];
    }) => submitEvaluation(sessionId, results),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.results(sessionId),
      });
      // Invalidate all list-by-user variants of "my sessions".
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.myAll() });
      // Accuracy of objectives just changed.
      queryClient.invalidateQueries({ queryKey: queryKeys.iepObjectives.all });
    },
  });
}
