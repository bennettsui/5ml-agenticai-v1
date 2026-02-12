import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedback } from "@/lib/api";
import type {
  FeedbackEvent,
  FeedbackCreate,
  FeedbackAnalysis,
  PaginatedResponse,
} from "@/types";

export function useFeedbackList(params?: {
  client_id?: string;
  status?: string;
  sentiment?: string;
  page?: number;
  size?: number;
}) {
  return useQuery<PaginatedResponse<FeedbackEvent>>({
    queryKey: ["feedback", params],
    queryFn: () => feedback.list(params),
  });
}

export function useFeedbackItem(id: string | undefined) {
  return useQuery<FeedbackEvent>({
    queryKey: ["feedback", id],
    queryFn: () => feedback.get(id!),
    enabled: !!id,
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FeedbackCreate) => feedback.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
  });
}

export function useAnalyzeFeedback() {
  const queryClient = useQueryClient();

  return useMutation<FeedbackAnalysis, Error, string>({
    mutationFn: (id: string) => feedback.analyze(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["feedback", id] });
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
  });
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: string;
      notes?: string;
    }) => feedback.updateStatus(id, status, notes),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["feedback", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
  });
}
