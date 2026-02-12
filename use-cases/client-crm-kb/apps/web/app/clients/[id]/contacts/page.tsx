"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { clients as clientsApi, contacts as contactsApi } from "@/lib/api";
import { ContactList } from "@/components/clients/ContactList";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function ClientContactsPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const { data: client, isLoading: loadingClient } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => clientsApi.get(clientId),
  });

  const {
    data: contacts,
    isLoading: loadingContacts,
    refetch,
  } = useQuery({
    queryKey: ["client-contacts", clientId],
    queryFn: () => contactsApi.list(clientId),
  });

  if (loadingClient) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/clients"
          className="hover:text-foreground transition-colors"
        >
          Clients
        </Link>
        <span>/</span>
        <Link
          href={`/clients/${clientId}`}
          className="hover:text-foreground transition-colors"
        >
          {client?.name ?? "..."}
        </Link>
        <span>/</span>
        <span className="text-foreground">Contacts</span>
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Manage contacts for {client?.name ?? "this client"}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/clients/${clientId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Client
        </Button>
      </div>

      {/* Contact List */}
      {loadingContacts ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ContactList
          clientId={clientId}
          contacts={contacts ?? []}
          onRefresh={() => refetch()}
        />
      )}
    </div>
  );
}
