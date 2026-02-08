import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContactSection } from "@/components/provider/contact-section";
import { LocationSection } from "@/components/provider/location-section";
import { ServicesSection } from "@/components/provider/services-section";
import { PhotosSection } from "@/components/provider/photos-section";
import { EventsSection } from "@/components/provider/events-section";
import { CouponsSection } from "@/components/provider/coupons-section";
import { ReviewsSection } from "@/components/provider/reviews-section";
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

  const provider = await prisma.provider.findUnique({
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
  });

  if (!provider) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
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

      {/* Bio */}
      {provider.bio && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-zinc-900">About</h2>
          <p className="mt-3 whitespace-pre-line text-zinc-600">
            {provider.bio}
          </p>
        </section>
      )}

      {/* Sections — each hides itself if empty */}
      <div className="mt-8 space-y-10">
        <ContactSection contacts={provider.contacts} />
        <LocationSection locations={provider.locations} />
        <ServicesSection services={provider.services} />
        <PhotosSection photos={provider.photos} />
        <EventsSection events={provider.events} />
        <CouponsSection coupons={provider.coupons} />
        <ReviewsSection reviews={provider.reviews} />
      </div>
    </div>
  );
}
