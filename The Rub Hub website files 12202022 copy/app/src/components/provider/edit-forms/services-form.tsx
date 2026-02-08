"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Service = {
  id: number;
  name: string;
  type: string | null;
  price: number | null;
  description: string | null;
  isSpecial: boolean;
  sortOrder: number;
};

type ServicesFormProps = {
  services: Service[];
  onCancel: () => void;
};

type ServiceDraft = {
  _key: string;
  id: number | null;
  name: string;
  type: string;
  price: string;
  description: string;
  isSpecial: boolean;
};

function toServiceDraft(s: Service): ServiceDraft {
  return {
    _key: crypto.randomUUID(),
    id: s.id,
    name: s.name,
    type: s.type ?? "",
    price: s.price != null ? String(s.price) : "",
    description: s.description ?? "",
    isSpecial: s.isSpecial,
  };
}

function emptyService(): ServiceDraft {
  return {
    _key: crypto.randomUUID(),
    id: null,
    name: "",
    type: "",
    price: "",
    description: "",
    isSpecial: false,
  };
}

export function ServicesForm({ services, onCancel }: ServicesFormProps) {
  const router = useRouter();
  const sorted = [...services].sort((a, b) => a.sortOrder - b.sortOrder);
  const [items, setItems] = useState<ServiceDraft[]>(
    sorted.length > 0 ? sorted.map(toServiceDraft) : [emptyService()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(index: number, updates: Partial<ServiceDraft>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyService()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = items.map((item, index) => ({
        id: item.id,
        name: item.name,
        type: item.type || null,
        price: item.price ? parseFloat(item.price) : null,
        description: item.description || null,
        isSpecial: item.isSpecial,
        sortOrder: index,
      }));

      const res = await fetch("/api/provider/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: payload }),
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
              Service {index + 1}
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

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor={`service-${index}-name`} className="block text-sm font-medium text-zinc-700">
                Name
              </label>
              <input
                id={`service-${index}-name`}
                type="text"
                required
                value={item.name}
                onChange={(e) => updateItem(index, { name: e.target.value })}
                className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label htmlFor={`service-${index}-type`} className="block text-sm font-medium text-zinc-700">
                Type
              </label>
              <input
                id={`service-${index}-type`}
                type="text"
                value={item.type}
                onChange={(e) => updateItem(index, { type: e.target.value })}
                className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor={`service-${index}-price`} className="block text-sm font-medium text-zinc-700">
                Price
              </label>
              <input
                id={`service-${index}-price`}
                type="number"
                step="0.01"
                min="0"
                value={item.price}
                onChange={(e) => updateItem(index, { price: e.target.value })}
                placeholder="0.00"
                className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div className="sm:col-span-2 flex items-end">
              <label className="flex items-center gap-2 text-sm text-zinc-700 pb-2">
                <input
                  type="checkbox"
                  checked={item.isSpecial}
                  onChange={(e) =>
                    updateItem(index, { isSpecial: e.target.checked })
                  }
                  className="rounded border-zinc-300"
                />
                Mark as Special
              </label>
            </div>
          </div>

          <div>
            <label htmlFor={`service-${index}-description`} className="block text-sm font-medium text-zinc-700">
              Description
            </label>
            <textarea
              id={`service-${index}-description`}
              rows={2}
              value={item.description}
              onChange={(e) =>
                updateItem(index, { description: e.target.value })
              }
              className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="text-sm font-medium text-brand-blue hover:underline"
      >
        + Add Service
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
