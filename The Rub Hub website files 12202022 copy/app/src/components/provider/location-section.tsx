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

export function LocationSection({ locations }: { locations: Location[] }) {
  const visible = locations.filter((l) => !l.hidden);
  if (visible.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-zinc-900">Locations</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {visible.map((loc) => (
          <div
            key={loc.id}
            className="rounded-lg border border-zinc-200 p-4"
          >
            {loc.name && (
              <p className="font-medium text-zinc-900">{loc.name}</p>
            )}
            <p className="text-sm text-zinc-600">{loc.address1}</p>
            {loc.address2 && (
              <p className="text-sm text-zinc-600">{loc.address2}</p>
            )}
            <p className="text-sm text-zinc-600">
              {loc.city}, {loc.state} {loc.zip}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
