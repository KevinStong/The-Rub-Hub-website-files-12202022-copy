"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Location = {
  id: number;
  name: string | null;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  hidden: boolean;
};

type LocationsFormProps = {
  locations: Location[];
  onCancel: () => void;
};

type LocationDraft = {
  id: number | null;
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  hidden: boolean;
};

function toLocationDraft(loc: Location): LocationDraft {
  return {
    id: loc.id,
    name: loc.name ?? "",
    address1: loc.address1,
    address2: loc.address2 ?? "",
    city: loc.city,
    state: loc.state,
    zip: loc.zip,
    country: loc.country,
    hidden: loc.hidden,
  };
}

function emptyLocation(): LocationDraft {
  return {
    id: null,
    name: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    hidden: false,
  };
}

export function LocationsForm({ locations, onCancel }: LocationsFormProps) {
  const router = useRouter();
  const [items, setItems] = useState<LocationDraft[]>(
    locations.length > 0 ? locations.map(toLocationDraft) : [emptyLocation()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(index: number, updates: Partial<LocationDraft>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyLocation()]);
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
        name: item.name || null,
        address1: item.address1,
        address2: item.address2 || null,
        city: item.city,
        state: item.state,
        zip: item.zip,
        country: item.country,
        hidden: item.hidden,
      }));

      const res = await fetch("/api/provider/locations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locations: payload }),
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
          key={index}
          className="rounded-lg border border-zinc-200 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700">
              Location {index + 1}
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

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Location Name
            </label>
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateItem(index, { name: e.target.value })}
              placeholder="e.g. Main Office"
              className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Address Line 1
            </label>
            <input
              type="text"
              value={item.address1}
              onChange={(e) => updateItem(index, { address1: e.target.value })}
              className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Address Line 2
            </label>
            <input
              type="text"
              value={item.address2}
              onChange={(e) => updateItem(index, { address2: e.target.value })}
              className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700">
                City
              </label>
              <input
                type="text"
                value={item.city}
                onChange={(e) => updateItem(index, { city: e.target.value })}
                className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                State
              </label>
              <input
                type="text"
                value={item.state}
                onChange={(e) => updateItem(index, { state: e.target.value })}
                className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                ZIP
              </label>
              <input
                type="text"
                value={item.zip}
                onChange={(e) => updateItem(index, { zip: e.target.value })}
                className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Country
            </label>
            <input
              type="text"
              value={item.country}
              onChange={(e) => updateItem(index, { country: e.target.value })}
              className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={item.hidden}
              onChange={(e) =>
                updateItem(index, { hidden: e.target.checked })
              }
              className="rounded border-zinc-300"
            />
            Hidden from public profile
          </label>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        + Add Location
      </button>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-zinc-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
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
