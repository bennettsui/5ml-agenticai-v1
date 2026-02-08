import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rules } from "@/lib/api";
import type {
  ClientRule,
  ClientRuleCreate,
  PaginatedResponse,
} from "@/types";

export function useRules(params?: {
  client_id?: string;
  status?: string;
  rule_type?: string;
  page?: number;
  size?: number;
}) {
  return useQuery<PaginatedResponse<ClientRule>>({
    queryKey: ["rules", params],
    queryFn: () => rules.list(params),
  });
}

export function useRule(id: string | undefined) {
  return useQuery<ClientRule>({
    queryKey: ["rules", id],
    queryFn: () => rules.get(id!),
    enabled: !!id,
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClientRuleCreate) => rules.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ClientRuleCreate>;
    }) => rules.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      queryClient.invalidateQueries({
        queryKey: ["rules", variables.id],
      });
    },
  });
}

export function useDeprecateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rules.deprecate(id, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      queryClient.invalidateQueries({
        queryKey: ["rules", variables.id],
      });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rules.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
    },
  });
}
