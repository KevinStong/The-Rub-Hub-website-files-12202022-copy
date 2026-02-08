"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Coupon = {
  id: number;
  name: string;
  description: string | null;
  smallPrint: string | null;
  promoCode: string | null;
  expirationDate: Date | string | null;
  firstTimeOnly: boolean;
  appointmentOnly: boolean;
  hidden: boolean;
  sortOrder: number;
};

type CouponsFormProps = {
  coupons: Coupon[];
  onCancel: () => void;
};

type CouponDraft = {
  _key: string;
  id: number | null;
  name: string;
  description: string;
  smallPrint: string;
  promoCode: string;
  expirationDate: string;
  firstTimeOnly: boolean;
  appointmentOnly: boolean;
  hidden: boolean;
};

function formatDate(d: Date | string | null): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function toCouponDraft(c: Coupon): CouponDraft {
  return {
    _key: crypto.randomUUID(),
    id: c.id,
    name: c.name,
    description: c.description ?? "",
    smallPrint: c.smallPrint ?? "",
    promoCode: c.promoCode ?? "",
    expirationDate: formatDate(c.expirationDate),
    firstTimeOnly: c.firstTimeOnly,
    appointmentOnly: c.appointmentOnly,
    hidden: c.hidden,
  };
}

function emptyCoupon(): CouponDraft {
  return {
    _key: crypto.randomUUID(),
    id: null,
    name: "",
    description: "",
    smallPrint: "",
    promoCode: "",
    expirationDate: "",
    firstTimeOnly: false,
    appointmentOnly: false,
    hidden: false,
  };
}

export function CouponsForm({ coupons, onCancel }: CouponsFormProps) {
  const router = useRouter();
  const sorted = [...coupons].sort((a, b) => a.sortOrder - b.sortOrder);
  const [items, setItems] = useState<CouponDraft[]>(
    sorted.length > 0 ? sorted.map(toCouponDraft) : [emptyCoupon()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(index: number, updates: Partial<CouponDraft>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyCoupon()]);
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
        description: item.description || null,
        smallPrint: item.smallPrint || null,
        promoCode: item.promoCode || null,
        expirationDate: item.expirationDate || null,
        firstTimeOnly: item.firstTimeOnly,
        appointmentOnly: item.appointmentOnly,
        hidden: item.hidden,
        sortOrder: index,
      }));

      const res = await fetch("/api/provider/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coupons: payload }),
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
              Coupon {index + 1}
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
              <label htmlFor={`coupon-${index}-name`} className="block text-sm font-medium text-zinc-700">
                Name
              </label>
              <input
                id={`coupon-${index}-name`}
                type="text"
                required
                value={item.name}
                onChange={(e) => updateItem(index, { name: e.target.value })}
                className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label htmlFor={`coupon-${index}-promoCode`} className="block text-sm font-medium text-zinc-700">
                Promo Code
              </label>
              <input
                id={`coupon-${index}-promoCode`}
                type="text"
                value={item.promoCode}
                onChange={(e) =>
                  updateItem(index, { promoCode: e.target.value })
                }
                className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor={`coupon-${index}-description`} className="block text-sm font-medium text-zinc-700">
              Description
            </label>
            <textarea
              id={`coupon-${index}-description`}
              rows={2}
              value={item.description}
              onChange={(e) =>
                updateItem(index, { description: e.target.value })
              }
              className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label htmlFor={`coupon-${index}-smallPrint`} className="block text-sm font-medium text-zinc-700">
              Small Print
            </label>
            <textarea
              id={`coupon-${index}-smallPrint`}
              rows={2}
              value={item.smallPrint}
              onChange={(e) =>
                updateItem(index, { smallPrint: e.target.value })
              }
              className="mt-1 w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label htmlFor={`coupon-${index}-expirationDate`} className="block text-sm font-medium text-zinc-700">
              Expiration Date
            </label>
            <input
              id={`coupon-${index}-expirationDate`}
              type="date"
              value={item.expirationDate}
              onChange={(e) =>
                updateItem(index, { expirationDate: e.target.value })
              }
              className="mt-1 w-full sm:w-auto border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={item.firstTimeOnly}
                onChange={(e) =>
                  updateItem(index, { firstTimeOnly: e.target.checked })
                }
                className="rounded border-zinc-300"
              />
              First-time only
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={item.appointmentOnly}
                onChange={(e) =>
                  updateItem(index, { appointmentOnly: e.target.checked })
                }
                className="rounded border-zinc-300"
              />
              Appointment only
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={item.hidden}
                onChange={(e) =>
                  updateItem(index, { hidden: e.target.checked })
                }
                className="rounded border-zinc-300"
              />
              Hidden
            </label>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        + Add Coupon
      </button>

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
