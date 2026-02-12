"use client";

import { useState } from "react";
import type { Contact, ContactCreate, ContactUpdate } from "@/types";
import { contacts as contactsApi, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Phone,
  Star,
  Pencil,
  Trash2,
  Plus,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactListProps {
  clientId: string;
  contacts: Contact[];
  onRefresh: () => void;
  readonly?: boolean;
}

const CHANNEL_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "chat", label: "Chat" },
  { value: "in_person", label: "In Person" },
];

interface ContactFormData {
  name: string;
  role: string;
  email: string;
  phone: string;
  preferred_channel: string;
  decision_power: string;
  is_primary: boolean;
  notes: string;
}

const emptyForm: ContactFormData = {
  name: "",
  role: "",
  email: "",
  phone: "",
  preferred_channel: "email",
  decision_power: "5",
  is_primary: false,
  notes: "",
};

export function ContactList({
  clientId,
  contacts,
  onRefresh,
  readonly = false,
}: ContactListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openAdd() {
    setEditingContact(null);
    setForm(emptyForm);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(contact: Contact) {
    setEditingContact(contact);
    setForm({
      name: contact.name,
      role: contact.role ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      preferred_channel: contact.preferred_channel ?? "email",
      decision_power: String(contact.decision_power ?? 5),
      is_primary: contact.is_primary,
      notes: contact.notes ?? "",
    });
    setError(null);
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      if (editingContact) {
        const updateData: ContactUpdate = {
          name: form.name,
          role: form.role || null,
          email: form.email || null,
          phone: form.phone || null,
          preferred_channel: (form.preferred_channel as ContactCreate["preferred_channel"]) || null,
          decision_power: parseInt(form.decision_power) || null,
          is_primary: form.is_primary,
          notes: form.notes || null,
        };
        await contactsApi.update(clientId, editingContact.id, updateData);
      } else {
        const createData: ContactCreate = {
          client_id: clientId,
          name: form.name,
          role: form.role || null,
          email: form.email || null,
          phone: form.phone || null,
          preferred_channel: (form.preferred_channel as ContactCreate["preferred_channel"]) || null,
          decision_power: parseInt(form.decision_power) || null,
          is_primary: form.is_primary,
          notes: form.notes || null,
        };
        await contactsApi.create(clientId, createData);
      }
      setDialogOpen(false);
      onRefresh();
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { detail?: string };
        setError(body?.detail || "Failed to save contact");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(contactId: string) {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    setDeleting(contactId);
    try {
      await contactsApi.delete(clientId, contactId);
      onRefresh();
    } catch {
      alert("Failed to delete contact");
    } finally {
      setDeleting(null);
    }
  }

  async function handleSetPrimary(contactId: string) {
    try {
      await contactsApi.update(clientId, contactId, { is_primary: true });
      onRefresh();
    } catch {
      alert("Failed to set primary contact");
    }
  }

  if (contacts.length === 0 && readonly) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No contacts found for this client.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!readonly && (
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingContact ? "Edit Contact" : "Add Contact"}
                </DialogTitle>
                <DialogDescription>
                  {editingContact
                    ? "Update the contact details below."
                    : "Fill in the contact details below."}
                </DialogDescription>
              </DialogHeader>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Name *</Label>
                  <Input
                    id="contact-name"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-role">Role</Label>
                    <Input
                      id="contact-role"
                      value={form.role}
                      onChange={(e) =>
                        setForm({ ...form, role: e.target.value })
                      }
                      placeholder="e.g. Marketing Director"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-channel">Preferred Channel</Label>
                    <Select
                      value={form.preferred_channel}
                      onValueChange={(val) =>
                        setForm({ ...form, preferred_channel: val })
                      }
                    >
                      <SelectTrigger id="contact-channel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHANNEL_OPTIONS.map((ch) => (
                          <SelectItem key={ch.value} value={ch.value}>
                            {ch.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Phone</Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-power">
                      Decision Power (1-10)
                    </Label>
                    <Input
                      id="contact-power"
                      type="number"
                      min={1}
                      max={10}
                      value={form.decision_power}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          decision_power: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2 flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer pb-2">
                      <input
                        type="checkbox"
                        checked={form.is_primary}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            is_primary: e.target.checked,
                          })
                        }
                        className="rounded border-input"
                      />
                      <span className="text-sm font-medium">
                        Primary Contact
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving || !form.name}>
                  {saving ? "Saving..." : editingContact ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-center">Decision Power</TableHead>
              <TableHead className="text-center">Status</TableHead>
              {!readonly && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={readonly ? 6 : 7}
                  className="text-center py-8 text-muted-foreground"
                >
                  <UserCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  No contacts yet. Add the first contact.
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{contact.name}</span>
                      {contact.is_primary && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">
                          <Star className="h-3 w-3 mr-0.5" />
                          Primary
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.role ?? "-"}
                  </TableCell>
                  <TableCell>
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {contact.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.phone ? (
                      <span className="flex items-center gap-1.5 text-sm">
                        <Phone className="h-3.5 w-3.5" />
                        {contact.phone}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {contact.decision_power != null ? (
                      <span
                        className={cn(
                          "inline-flex items-center justify-center rounded-full h-7 w-7 text-xs font-bold",
                          contact.decision_power >= 8
                            ? "bg-green-100 text-green-800"
                            : contact.decision_power >= 5
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        )}
                      >
                        {contact.decision_power}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        contact.status === "active" ? "success" : "secondary"
                      }
                    >
                      {contact.status}
                    </Badge>
                  </TableCell>
                  {!readonly && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!contact.is_primary && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Set as primary"
                            onClick={() => handleSetPrimary(contact.id)}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit contact"
                          onClick={() => openEdit(contact)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete contact"
                          onClick={() => handleDelete(contact.id)}
                          disabled={deleting === contact.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
