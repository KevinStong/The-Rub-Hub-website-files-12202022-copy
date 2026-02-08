"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type BioFormProps = {
  provider: { name: string; bio: string | null };
  onCancel: () => void;
};

export function BioForm({ provider, onCancel }: BioFormProps) {
  const router = useRouter();
  const [name, setName] = useState(provider.name);
  const [bio, setBio] = useState(provider.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/provider/bio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
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
      <div>
        <label
          htmlFor="bio-name"
          className="block text-sm font-medium text-zinc-700"
        >
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="bio-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>

      <div>
        <label
          htmlFor="bio-bio"
          className="block text-sm font-medium text-zinc-700"
        >
          Bio
        </label>
        <textarea
          id="bio-bio"
          rows={6}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
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
