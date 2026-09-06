import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface DailyBriefResponse {
  brief: string;
}

/**
 * Hook to fetch the AI daily brief
 * Stale time is 30 minutes to prevent wasteful AI generations on page switches
 */
export function useDailyBrief() {
  const queryClient = useQueryClient();

  const query = useQuery<DailyBriefResponse>({
    queryKey: ["agent", "brief"],
    queryFn: async () => {
      const res = await fetch("/api/agent/brief");
      if (!res.ok) {
        throw new Error("Failed to fetch daily brief");
      }
      return res.json();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  const regenerate = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/agent/brief");
      if (!res.ok) {
        throw new Error("Failed to generate brief");
      }
      return (await res.json()) as DailyBriefResponse;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["agent", "brief"], data);
    },
  });

  return {
    ...query,
    regenerateBrief: regenerate.mutate,
    isRegenerating: regenerate.isPending,
  };
}
