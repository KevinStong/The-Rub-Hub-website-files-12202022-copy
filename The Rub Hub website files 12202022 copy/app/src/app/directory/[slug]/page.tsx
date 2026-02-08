import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOwnerStatus } from "@/lib/get-owner-status";
import { ProfileEditor } from "@/components/provider/profile-editor";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const provider = await prisma.provider.findUnique({
    where: { slug },
    select: { name: true, bio: true },
  });

  if (!provider) return { title: "Provider Not Found" };

  return {
    title: `${provider.name} — The Rub Hub`,
    description: provider.bio
      ? provider.bio.slice(0, 160)
      : `View ${provider.name}'s profile on The Rub Hub.`,
  };
}

export default async function ProviderProfilePage({ params }: PageProps) {
  const { slug } = await params;

  const [provider, isOwner] = await Promise.all([
    prisma.provider.findUnique({
      where: { slug },
      include: {
        contacts: true,
        locations: true,
        services: true,
        photos: true,
        events: true,
        coupons: true,
        reviews: true,
        categories: { include: { category: true } },
        specialties: { include: { specialty: true } },
      },
    }),
    getOwnerStatus(slug),
  ]);

  if (!provider) notFound();

  // Serialize provider data for the client component.
  // JSON round-trip converts Prisma Decimal fields (service.price) to numbers
  // and Date fields to ISO strings, making the data safe for client hydration.
  const serializedProvider = JSON.parse(JSON.stringify({
    name: provider.name,
    bio: provider.bio,
    contacts: provider.contacts,
    locations: provider.locations,
    services: provider.services,
    photos: provider.photos,
    events: provider.events,
    coupons: provider.coupons,
    reviews: provider.reviews,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Owner banner */}
      {isOwner && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          This is your profile. Hover over sections to edit.
        </div>
      )}

      {/* Header — always server-rendered, not editable via ProfileEditor */}
      <h1 className="text-3xl font-bold text-zinc-900">{provider.name}</h1>
      {provider.categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {provider.categories.map((pc) => (
            <span
              key={pc.categoryId}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
            >
              {pc.category.name}
            </span>
          ))}
        </div>
      )}
      {provider.specialties.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {provider.specialties.map((ps) => (
            <span
              key={ps.specialtyId}
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
            >
              {ps.specialty.name}
            </span>
          ))}
        </div>
      )}

      {/* Editable sections managed by the client ProfileEditor */}
      <ProfileEditor provider={serializedProvider} isOwner={isOwner} />
    </div>
  );
}
