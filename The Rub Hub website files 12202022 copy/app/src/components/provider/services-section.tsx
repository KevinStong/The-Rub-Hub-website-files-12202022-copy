type Service = {
  id: number;
  name: string;
  type: string | null;
  price: number | string | null;
  description: string | null;
  isSpecial: boolean;
  sortOrder: number;
};

export function ServicesSection({ services }: { services: Service[] }) {
  if (services.length === 0) return null;

  const sorted = [...services].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section>
      <h2 className="text-xl font-semibold text-zinc-900">Services</h2>
      <div className="mt-4 space-y-3">
        {sorted.map((service) => (
          <div
            key={service.id}
            className={`rounded-lg border p-4 ${
              service.isSpecial
                ? "border-amber-300 bg-amber-50"
                : "border-zinc-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-zinc-900">
                  {service.name}
                  {service.isSpecial && (
                    <span className="ml-2 inline-block rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Special
                    </span>
                  )}
                </p>
                {service.description && (
                  <p className="mt-1 text-sm text-zinc-600">
                    {service.description}
                  </p>
                )}
              </div>
              {service.price && (
                <span className="shrink-0 text-sm font-semibold text-brand-blue">
                  ${Number(service.price).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
