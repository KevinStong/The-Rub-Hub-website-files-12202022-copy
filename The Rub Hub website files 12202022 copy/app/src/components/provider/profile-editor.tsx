"use client";

import { useState } from "react";
import { ContactSection } from "@/components/provider/contact-section";
import { LocationSection } from "@/components/provider/location-section";
import { ServicesSection } from "@/components/provider/services-section";
import { PhotosSection } from "@/components/provider/photos-section";
import { EventsSection } from "@/components/provider/events-section";
import { CouponsSection } from "@/components/provider/coupons-section";
import { ReviewsSection } from "@/components/provider/reviews-section";
import { BioForm } from "@/components/provider/edit-forms/bio-form";
import { ContactsForm } from "@/components/provider/edit-forms/contacts-form";
import { LocationsForm } from "@/components/provider/edit-forms/locations-form";
import { ServicesForm } from "@/components/provider/edit-forms/services-form";
import { EventsForm } from "@/components/provider/edit-forms/events-form";
import { CouponsForm } from "@/components/provider/edit-forms/coupons-form";

type EditableSection =
  | "bio"
  | "contacts"
  | "locations"
  | "services"
  | "events"
  | "coupons"
  | null;

type Contact = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  isPublic: boolean;
};

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

type Service = {
  id: number;
  name: string;
  type: string | null;
  price: number | null;
  description: string | null;
  isSpecial: boolean;
  sortOrder: number;
};

type Photo = {
  id: number;
  name: string | null;
  caption: string | null;
  url: string;
  hidden: boolean;
  sortOrder: number;
};

type Event = {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  city: string | null;
  state: string | null;
  hidden: boolean;
};

type Coupon = {
  id: number;
  name: string;
  description: string | null;
  smallPrint: string | null;
  promoCode: string | null;
  expirationDate: string | null;
  firstTimeOnly: boolean;
  appointmentOnly: boolean;
  hidden: boolean;
  sortOrder: number;
};

type Review = {
  id: number;
  content: string;
  status: string;
  createdAt: string;
};

type ProfileEditorProps = {
  provider: {
    name: string;
    bio: string | null;
    contacts: Contact[];
    locations: Location[];
    services: Service[];
    photos: Photo[];
    events: Event[];
    coupons: Coupon[];
    reviews: Review[];
  };
  isOwner: boolean;
};

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity rounded bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
    >
      Edit
    </button>
  );
}

export function ProfileEditor({ provider, isOwner }: ProfileEditorProps) {
  const [editingSection, setEditingSection] =
    useState<EditableSection>(null);

  function cancelEditing() {
    setEditingSection(null);
  }

  return (
    <>
      {/* Bio / About section */}
      <div className="group relative mt-8">
        {isOwner && editingSection !== "bio" && (
          <EditButton onClick={() => setEditingSection("bio")} />
        )}
        {editingSection === "bio" ? (
          <BioForm provider={provider} onCancel={cancelEditing} />
        ) : (
          <section>
            <h2 className="text-xl font-semibold text-zinc-900">About</h2>
            {provider.bio && (
              <p className="mt-3 whitespace-pre-line text-zinc-600">
                {provider.bio}
              </p>
            )}
          </section>
        )}
      </div>

      {/* Remaining sections */}
      <div className="mt-8 space-y-10">
        {/* Contacts */}
        <div className="group relative">
          {isOwner && editingSection !== "contacts" && (
            <EditButton onClick={() => setEditingSection("contacts")} />
          )}
          {editingSection === "contacts" ? (
            <ContactsForm
              contacts={provider.contacts}
              onCancel={cancelEditing}
            />
          ) : (
            <ContactSection contacts={provider.contacts} />
          )}
        </div>

        {/* Locations */}
        <div className="group relative">
          {isOwner && editingSection !== "locations" && (
            <EditButton onClick={() => setEditingSection("locations")} />
          )}
          {editingSection === "locations" ? (
            <LocationsForm
              locations={provider.locations}
              onCancel={cancelEditing}
            />
          ) : (
            <LocationSection locations={provider.locations} />
          )}
        </div>

        {/* Services */}
        <div className="group relative">
          {isOwner && editingSection !== "services" && (
            <EditButton onClick={() => setEditingSection("services")} />
          )}
          {editingSection === "services" ? (
            <ServicesForm
              services={provider.services}
              onCancel={cancelEditing}
            />
          ) : (
            <ServicesSection services={provider.services as any} />
          )}
        </div>

        {/* Photos — always read-only */}
        <PhotosSection photos={provider.photos} />

        {/* Events */}
        <div className="group relative">
          {isOwner && editingSection !== "events" && (
            <EditButton onClick={() => setEditingSection("events")} />
          )}
          {editingSection === "events" ? (
            <EventsForm events={provider.events} onCancel={cancelEditing} />
          ) : (
            <EventsSection events={provider.events as any} />
          )}
        </div>

        {/* Coupons */}
        <div className="group relative">
          {isOwner && editingSection !== "coupons" && (
            <EditButton onClick={() => setEditingSection("coupons")} />
          )}
          {editingSection === "coupons" ? (
            <CouponsForm
              coupons={provider.coupons}
              onCancel={cancelEditing}
            />
          ) : (
            <CouponsSection coupons={provider.coupons as any} />
          )}
        </div>

        {/* Reviews — always read-only */}
        <ReviewsSection reviews={provider.reviews as any} />
      </div>
    </>
  );
}
