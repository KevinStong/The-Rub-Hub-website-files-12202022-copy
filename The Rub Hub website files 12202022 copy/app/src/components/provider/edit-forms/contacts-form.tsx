"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Contact = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  isPublic: boolean;
};

type ContactsFormProps = {
  contacts: Contact[];
  onCancel: () => void;
};

type ContactDraft = {
  _key: string;
  id: number | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isPublic: boolean;
};

function toContactDraft(c: Contact): ContactDraft {
  return {
    _key: crypto.randomUUID(),
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email ?? "",
    phone: c.phone ?? "",
    isPublic: c.isPublic,
  };
}

function emptyContact(): ContactDraft {
  return {
    _key: crypto.randomUUID(),
    id: null,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    isPublic: true,
  };
}

export function ContactsForm({ contacts, onCancel }: ContactsFormProps) {
  const router = useRouter();
  const [items, setItems] = useState<ContactDraft[]>(
    contacts.length > 0 ? contacts.map(toContactDraft) : [emptyContact()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(index: number, updates: Partial<ContactDraft>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyContact()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = items.map((item) => ({
        id: item.id,
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email || null,
        phone: item.phone || null,
        isPublic: item.isPublic,
      }));

      const res = await fetch("/api/provider/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: payload }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }

      router.refresh();
      onCancel();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {items.map((item, index) => (
        <div
          key={item._key}
          className="rounded-lg border border-zinc-200 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700">
              Contact {index + 1}
            </span>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`contact-${index}-firstName`} className="block text-sm font-medium text-zinc-700">
                First Name
              </label>
              <input
                id={`contact-${index}-firstName`}
                type="text"
                required
                value={item.firstName}
                onChange={(e) =>
                  updateItem(index, { firstName: e.target.value })
                }
                className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label htmlFor={`contact-${index}-lastName`} className="block text-sm font-medium text-zinc-700">
                Last Name
              </label>
              <input
                id={`contact-${index}-lastName`}
                type="text"
                value={item.lastName}
                onChange={(e) =>
                  updateItem(index, { lastName: e.target.value })
                }
                className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`contact-${index}-email`} className="block text-sm font-medium text-zinc-700">
                Email
              </label>
              <input
                id={`contact-${index}-email`}
                type="email"
                value={item.email}
                onChange={(e) =>
                  updateItem(index, { email: e.target.value })
                }
                className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label htmlFor={`contact-${index}-phone`} className="block text-sm font-medium text-zinc-700">
                Phone
              </label>
              <input
                id={`contact-${index}-phone`}
                type="tel"
                value={item.phone}
                onChange={(e) =>
                  updateItem(index, { phone: e.target.value })
                }
                className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={item.isPublic}
              onChange={(e) =>
                updateItem(index, { isPublic: e.target.checked })
              }
              className="rounded border-zinc-300"
            />
            Publicly visible
          </label>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="text-sm font-medium text-brand-blue hover:underline"
      >
        + Add Contact
      </button>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-gold text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-gold-dark transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="border border-zinc-300 rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
