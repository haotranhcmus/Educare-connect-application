import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitEvaluation, ResultInput } from "../api/evalApi";

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
        queryKey: ["sessions", "detail", sessionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["sessions", "results", sessionId],
      });
      queryClient.invalidateQueries({ queryKey: ["sessions", "my"] });
      // Also invalidate objective data since accuracy updated
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
    },
  });
}
