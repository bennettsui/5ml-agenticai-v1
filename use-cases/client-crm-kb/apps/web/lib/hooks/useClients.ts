import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clients } from "@/lib/api";
import type {
  Client,
  ClientCreate,
  ClientUpdate,
  ClientOverview,
  PaginatedResponse,
} from "@/types";

export function useClients(params?: {
  page?: number;
  size?: number;
  status?: string;
  search?: string;
}) {
  return useQuery<PaginatedResponse<Client>>({
    queryKey: ["clients", params],
    queryFn: () => clients.list(params),
  });
}

export function useClient(id: string | undefined) {
  return useQuery<Client>({
    queryKey: ["clients", id],
    queryFn: () => clients.get(id!),
    enabled: !!id,
  });
}

export function useClientOverview(id: string | undefined) {
  return useQuery<ClientOverview>({
    queryKey: ["clients", id, "overview"],
    queryFn: () => clients.overview(id!),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClientCreate) => clients.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientUpdate }) =>
      clients.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({
        queryKey: ["clients", variables.id],
      });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clients.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
