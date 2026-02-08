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

export function EventsSection({ events }: { events: Event[] }) {
  const visible = events.filter((e) => !e.hidden);
  if (visible.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-zinc-900">Events</h2>
      <div className="mt-4 space-y-3">
        {visible.map((event) => (
          <div
            key={event.id}
            className="rounded-lg border border-zinc-200 p-4"
          >
            <p className="font-medium text-zinc-900">{event.name}</p>
            <p className="mt-1 text-sm text-zinc-500">
              {new Date(event.startDate).toLocaleDateString()}
              {event.endDate &&
                ` – ${new Date(event.endDate).toLocaleDateString()}`}
              {event.city && event.state && ` · ${event.city}, ${event.state}`}
            </p>
            {event.description && (
              <p className="mt-2 text-sm text-zinc-600">
                {event.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
