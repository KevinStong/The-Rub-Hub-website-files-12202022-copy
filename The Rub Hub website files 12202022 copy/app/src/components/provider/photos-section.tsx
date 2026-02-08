type Photo = {
  id: number;
  name: string | null;
  caption: string | null;
  url: string;
  hidden: boolean;
  sortOrder: number;
};

export function PhotosSection({ photos }: { photos: Photo[] }) {
  const visible = photos.filter((p) => !p.hidden).sort((a, b) => a.sortOrder - b.sortOrder);
  if (visible.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold text-zinc-900">Photos</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {visible.map((photo) => (
          <div key={photo.id}>
            <img
              src={photo.url}
              alt={photo.caption || photo.name || "Provider photo"}
              className="aspect-square w-full rounded-lg border border-zinc-200 object-cover"
            />
            {photo.caption && (
              <p className="mt-1 text-xs text-zinc-500">{photo.caption}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
