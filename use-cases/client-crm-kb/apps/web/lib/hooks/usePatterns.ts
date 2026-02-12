import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patterns } from "@/lib/api";
import type { Pattern, PatternCreate, PaginatedResponse } from "@/types";

export function usePatterns(params?: {
  scope?: string;
  category?: string;
  client_id?: string;
  page?: number;
  size?: number;
}) {
  return useQuery<PaginatedResponse<Pattern>>({
    queryKey: ["patterns", params],
    queryFn: () => patterns.list(params),
  });
}

export function usePattern(id: string | undefined) {
  return useQuery<Pattern>({
    queryKey: ["patterns", id],
    queryFn: () => patterns.get(id!),
    enabled: !!id,
  });
}

export function useCreatePattern() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PatternCreate) => patterns.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patterns"] });
    },
  });
}

export function useUpdatePattern() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<PatternCreate>;
    }) => patterns.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["patterns"] });
      queryClient.invalidateQueries({
        queryKey: ["patterns", variables.id],
      });
    },
  });
}

export function useDeletePattern() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => patterns.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patterns"] });
    },
  });
}
