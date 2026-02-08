"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Event = {
  id: number;
  name: string;
  description: string | null;
  startDate: Date | string;
  endDate: Date | string | null;
  city: string | null;
  state: string | null;
  hidden: boolean;
};

type EventsFormProps = {
  events: Event[];
  onCancel: () => void;
};

type EventDraft = {
  id: number | null;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  city: string;
  state: string;
  hidden: boolean;
};

function formatDate(d: Date | string | null): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function toEventDraft(ev: Event): EventDraft {
  return {
    id: ev.id,
    name: ev.name,
    description: ev.description ?? "",
    startDate: formatDate(ev.startDate),
    endDate: formatDate(ev.endDate),
    city: ev.city ?? "",
    state: ev.state ?? "",
    hidden: ev.hidden,
  };
}

function emptyEvent(): EventDraft {
  return {
    id: null,
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    city: "",
    state: "",
    hidden: false,
  };
}

export function EventsForm({ events, onCancel }: EventsFormProps) {
  const router = useRouter();
  const [items, setItems] = useState<EventDraft[]>(
    events.length > 0 ? events.map(toEventDraft) : [emptyEvent()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(index: number, updates: Partial<EventDraft>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyEvent()]);
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
        name: item.name,
        description: item.description || null,
        startDate: item.startDate || null,
        endDate: item.endDate || null,
        city: item.city || null,
        state: item.state || null,
        hidden: item.hidden,
      }));

      const res = await fetch("/api/provider/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: payload }),
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
              Event {index + 1}
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
              Name
            </label>
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateItem(index, { name: e.target.value })}
              className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Description
            </label>
            <textarea
              rows={3}
              value={item.description}
              onChange={(e) =>
                updateItem(index, { description: e.target.value })
              }
              className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Start Date
              </label>
              <input
                type="date"
                value={item.startDate}
                onChange={(e) =>
                  updateItem(index, { startDate: e.target.value })
                }
                className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                End Date
              </label>
              <input
                type="date"
                value={item.endDate}
                onChange={(e) =>
                  updateItem(index, { endDate: e.target.value })
                }
                className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
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
        + Add Event
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
