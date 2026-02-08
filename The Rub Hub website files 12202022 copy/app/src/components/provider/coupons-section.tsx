type Coupon = {
  id: number;
  name: string;
  description: string | null;
  smallPrint: string | null;
  promoCode: string | null;
  expirationDate: Date | null;
  firstTimeOnly: boolean;
  appointmentOnly: boolean;
  hidden: boolean;
  sortOrder: number;
};

export function CouponsSection({ coupons }: { coupons: Coupon[] }) {
  const visible = coupons
    .filter((c) => !c.hidden)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (visible.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-zinc-900">Coupons</h2>
      <div className="mt-4 space-y-3">
        {visible.map((coupon) => (
          <div
            key={coupon.id}
            className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4"
          >
            <p className="font-medium text-zinc-900">{coupon.name}</p>
            {coupon.description && (
              <p className="mt-1 text-sm text-zinc-600">
                {coupon.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
              {coupon.promoCode && (
                <span className="rounded bg-zinc-200 px-2 py-0.5 font-mono">
                  {coupon.promoCode}
                </span>
              )}
              {coupon.expirationDate && (
                <span>
                  Expires{" "}
                  {new Date(coupon.expirationDate).toLocaleDateString()}
                </span>
              )}
              {coupon.firstTimeOnly && <span>First-time only</span>}
              {coupon.appointmentOnly && <span>Appointment only</span>}
            </div>
            {coupon.smallPrint && (
              <p className="mt-2 text-xs text-zinc-400">{coupon.smallPrint}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
