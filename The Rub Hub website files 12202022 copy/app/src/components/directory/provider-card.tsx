import Link from "next/link";

type ProviderCardProps = {
  provider: {
    slug: string;
    name: string;
    bio: string | null;
    categories: { category: { name: string } }[];
    locations: { city: string; state: string }[];
  };
};

export function ProviderCard({ provider }: ProviderCardProps) {
  const primaryCategory = provider.categories[0]?.category.name;
  const primaryLocation = provider.locations[0];

  return (
    <Link
      href={`/directory/${provider.slug}`}
      className="block rounded-lg border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md"
    >
      <h2 className="text-lg font-semibold text-zinc-900">{provider.name}</h2>
      <div className="mt-1 flex flex-wrap gap-2 text-sm text-zinc-500">
        {primaryCategory && <span>{primaryCategory}</span>}
        {primaryCategory && primaryLocation && (
          <span aria-hidden="true">&middot;</span>
        )}
        {primaryLocation && (
          <span>
            {primaryLocation.city}, {primaryLocation.state}
          </span>
        )}
      </div>
      {provider.bio && (
        <p className="mt-3 line-clamp-2 text-sm text-zinc-600">
          {provider.bio}
        </p>
      )}
    </Link>
  );
}
