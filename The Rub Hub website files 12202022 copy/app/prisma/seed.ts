import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import * as mysql from "mysql2/promise";

// ─── Helpers ──────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parsePrice(price: string | null | undefined): number | null {
  if (!price) return null;
  const match = price.replace(/[$,]/g, "").match(/[\d.]+/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return isNaN(num) ? null : num;
}

function yesNoToBool(val: string | null | undefined): boolean {
  return val === "Yes";
}

function isValidDate(d: unknown): boolean {
  if (!d) return false;
  const str = String(d);
  return str !== "0000-00-00" && str !== "0000-00-00 00:00:00" && !str.startsWith("0000");
}

function parseLegacyUrl(): { host: string; port: number; user: string; password: string } {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || "3306"),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  };
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  const dbConfig = parseLegacyUrl();
  const adapter = new PrismaMariaDb({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: "rubhub",
  });
  const prisma = new PrismaClient({ adapter });

  const legacy = await mysql.createConnection({
    ...dbConfig,
    database: "rubhub_legacy",
  });

  try {
    console.log("Connected to legacy database.");
    console.log("Clearing existing data...");

    // Clear in reverse dependency order
    try {
      await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");
      await prisma.providerCategory.deleteMany();
      await prisma.providerSpecialty.deleteMany();
      await prisma.review.deleteMany();
      await prisma.coupon.deleteMany();
      await prisma.event.deleteMany();
      await prisma.photo.deleteMany();
      await prisma.service.deleteMany();
      await prisma.location.deleteMany();
      await prisma.contact.deleteMany();
      await prisma.provider.deleteMany();
      await prisma.user.deleteMany();
      await prisma.category.deleteMany();
      await prisma.specialty.deleteMany();
    } finally {
      await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
    }

    // ─── Build lookup maps ────────────────────────────────────
    const [states] = await legacy.query("SELECT id, short_name FROM state");
    const stateMap = new Map<number, string>();
    for (const s of states as any[]) {
      stateMap.set(s.id, s.short_name || "");
    }

    const [countries] = await legacy.query("SELECT id, short_name FROM country");
    const countryMap = new Map<number, string>();
    for (const c of countries as any[]) {
      countryMap.set(c.id, c.short_name || "US");
    }

    // ─── 1. Categories ────────────────────────────────────────
    console.log("\n1. Migrating categories...");
    const [legacyCategories] = await legacy.query(
      "SELECT id, name FROM listing_subcategory WHERE (hidden = 'No' OR hidden IS NULL) AND name IS NOT NULL AND name != ''"
    );

    const categoryIdMap = new Map<number, number>();
    const seenCategorySlugs = new Set<string>();

    for (const cat of legacyCategories as any[]) {
      let slug = slugify(cat.name);
      if (!slug) slug = `category-${cat.id}`;
      if (seenCategorySlugs.has(slug)) slug = `${slug}-${cat.id}`;
      seenCategorySlugs.add(slug);

      try {
        const created = await prisma.category.create({
          data: { name: cat.name.trim(), slug },
        });
        categoryIdMap.set(cat.id, created.id);
      } catch {
        console.warn(`  Skipped duplicate category: ${cat.name}`);
      }
    }
    console.log(`  Migrated ${categoryIdMap.size} categories`);

    // ─── 2. Specialties ───────────────────────────────────────
    console.log("\n2. Migrating specialties...");
    const [legacySpecialties] = await legacy.query(
      "SELECT id, name FROM ailment_subcategory WHERE (hidden = 'No' OR hidden IS NULL) AND name IS NOT NULL AND name != ''"
    );

    const specialtyIdMap = new Map<number, number>();
    const seenSpecialtySlugs = new Set<string>();

    for (const spec of legacySpecialties as any[]) {
      let slug = slugify(spec.name);
      if (!slug) slug = `specialty-${spec.id}`;
      if (seenSpecialtySlugs.has(slug)) slug = `${slug}-${spec.id}`;
      seenSpecialtySlugs.add(slug);

      try {
        const created = await prisma.specialty.create({
          data: { name: spec.name.trim(), slug },
        });
        specialtyIdMap.set(spec.id, created.id);
      } catch {
        console.warn(`  Skipped duplicate specialty: ${spec.name}`);
      }
    }
    console.log(`  Migrated ${specialtyIdMap.size} specialties`);

    // ─── 3. Users + Providers ─────────────────────────────────
    console.log("\n3. Migrating providers (and users where applicable)...");
    const [legacyListings] = await legacy.query(
      `SELECT id, short_url_string, name, html_data, username, password, email,
              url, phone, fax, address1, address2, city, state_id, country_id, zip,
              status, created, updated
       FROM listing
       WHERE status = 'active' AND hidden = 'No'`
    );

    const providerIdMap = new Map<number, number>();
    const seenSlugs = new Set<string>();
    // Track which providers got a location from listing~location
    const providersWithLocation = new Set<number>();
    // Store listing-level location data for fallback
    const listingLocationData = new Map<number, any>();

    for (const listing of legacyListings as any[]) {
      // Generate slug
      let slug = listing.short_url_string
        ? slugify(listing.short_url_string)
        : slugify(listing.name || "");
      if (!slug) slug = `provider-${listing.id}`;
      if (seenSlugs.has(slug)) slug = `${slug}-${listing.id}`;
      seenSlugs.add(slug);

      // Strip HTML tags from bio for cleaner text
      const bio = listing.html_data
        ? String(listing.html_data).replace(/<[^>]*>/g, "").trim() || null
        : null;

      // Create User if listing has an email
      let userId: number | null = null;
      if (listing.email && listing.email.trim()) {
        try {
          const user = await prisma.user.create({
            data: {
              email: listing.email.trim(),
              passwordHash: listing.password || "no-password",
              firstName: listing.name || "Provider",
              lastName: "",
            },
          });
          userId = user.id;
        } catch {
          // Duplicate email — look up existing user
          const existing = await prisma.user.findUnique({
            where: { email: listing.email.trim() },
          });
          if (existing) {
            // Only link if no other provider already uses this user
            const existingProvider = await prisma.provider.findFirst({
              where: { userId: existing.id },
            });
            if (!existingProvider) {
              userId = existing.id;
            } else {
              console.warn(`  User ${listing.email} already linked to another provider, skipping link`);
            }
          }
        }
      }

      const createdAt =
        isValidDate(listing.created) ? new Date(listing.created) : new Date();
      const updatedAt =
        isValidDate(listing.updated) ? new Date(listing.updated) : createdAt;

      try {
        const provider = await prisma.provider.create({
          data: {
            slug,
            name: (listing.name || "Unknown Provider").trim(),
            bio,
            status: "active",
            createdAt,
            updatedAt,
            userId,
          },
        });
        providerIdMap.set(listing.id, provider.id);

        // Store listing-level location data for fallback creation
        if (listing.address1 || listing.city) {
          listingLocationData.set(provider.id, {
            address1: (listing.address1 || "").trim(),
            address2: (listing.address2 || "").trim() || null,
            city: (listing.city || "").trim(),
            state_id: listing.state_id,
            country_id: listing.country_id,
            zip: (listing.zip || "").trim(),
            phone: listing.phone,
          });
        }
      } catch (e) {
        console.warn(`  Failed to create provider ${listing.name}: ${e}`);
      }
    }
    console.log(`  Migrated ${providerIdMap.size} providers`);

    // ─── 4. Provider ↔ Category junctions ─────────────────────
    console.log("\n4. Migrating provider-category links...");
    const [legacyProvCats] = await legacy.query(
      "SELECT listing_id, listing_subcategory_id FROM `listing~listing_subcategory`"
    );

    let provCatCount = 0;
    for (const pc of legacyProvCats as any[]) {
      const providerId = providerIdMap.get(pc.listing_id);
      const categoryId = categoryIdMap.get(pc.listing_subcategory_id);
      if (!providerId || !categoryId) continue;

      try {
        await prisma.providerCategory.create({
          data: { providerId, categoryId },
        });
        provCatCount++;
      } catch {
        // duplicate, skip
      }
    }
    console.log(`  Migrated ${provCatCount} provider-category links`);

    // ─── 5. Provider ↔ Specialty junctions ────────────────────
    console.log("\n5. Migrating provider-specialty links...");
    const [legacyProvSpecs] = await legacy.query(
      "SELECT listing_id, ailment_subcategory_id FROM `listing~ailment_subcategory`"
    );

    let provSpecCount = 0;
    for (const ps of legacyProvSpecs as any[]) {
      const providerId = providerIdMap.get(ps.listing_id);
      const specialtyId = specialtyIdMap.get(ps.ailment_subcategory_id);
      if (!providerId || !specialtyId) continue;

      try {
        await prisma.providerSpecialty.create({
          data: { providerId, specialtyId },
        });
        provSpecCount++;
      } catch {
        // duplicate, skip
      }
    }
    console.log(`  Migrated ${provSpecCount} provider-specialty links`);

    // ─── 6. Contacts ──────────────────────────────────────────
    console.log("\n6. Migrating contacts...");
    const [legacyContacts] = await legacy.query(
      `SELECT id, listing_id, first_name, last_name, email, phone,
              email_private, phone_private, first_name_private, last_name_private
       FROM \`listing~contact\`
       WHERE hidden != 'Yes' OR hidden IS NULL`
    );

    let contactCount = 0;
    for (const c of legacyContacts as any[]) {
      const providerId = providerIdMap.get(c.listing_id);
      if (!providerId) continue;

      const firstName = (c.first_name || "").trim();
      const lastName = (c.last_name || "").trim();
      if (!firstName && !lastName) continue;

      const anyPrivate =
        yesNoToBool(c.email_private) ||
        yesNoToBool(c.phone_private) ||
        yesNoToBool(c.first_name_private) ||
        yesNoToBool(c.last_name_private);

      try {
        await prisma.contact.create({
          data: {
            providerId,
            firstName: firstName || "Unknown",
            lastName: lastName || "",
            email: c.email?.trim() || null,
            phone: c.phone?.trim() || null,
            isPublic: !anyPrivate,
          },
        });
        contactCount++;
      } catch (e) {
        console.warn(`  Failed to create contact: ${e}`);
      }
    }
    console.log(`  Migrated ${contactCount} contacts`);

    // ─── 7. Locations ─────────────────────────────────────────
    console.log("\n7. Migrating locations...");
    const [legacyLocations] = await legacy.query(
      `SELECT id, listing_id, name, address1, address2, city, state_id, zip,
              country_id, lat, lng
       FROM \`listing~location\`
       WHERE hidden != 'Yes' OR hidden IS NULL`
    );

    let locationCount = 0;
    for (const loc of legacyLocations as any[]) {
      const providerId = providerIdMap.get(loc.listing_id);
      if (!providerId) continue;

      const address1 = (loc.address1 || "").trim();
      const city = (loc.city || "").trim();
      const state = stateMap.get(loc.state_id) || "";
      const zip = (loc.zip || "").trim();

      if (!address1 && !city) continue;

      providersWithLocation.add(providerId);

      try {
        await prisma.location.create({
          data: {
            providerId,
            name: loc.name?.trim() || null,
            address1: address1 || "No address",
            address2: loc.address2?.trim() || null,
            city: city || "Unknown",
            state: state || "NA",
            zip: zip || "00000",
            country: countryMap.get(loc.country_id) || "US",
            lat: loc.lat || null,
            lng: loc.lng || null,
            hidden: false,
          },
        });
        locationCount++;
      } catch (e) {
        console.warn(`  Failed to create location: ${e}`);
      }
    }

    // Create fallback locations from listing-level address data
    let fallbackLocationCount = 0;
    for (const [providerId, data] of listingLocationData) {
      if (providersWithLocation.has(providerId)) continue;
      if (!data.address1 && !data.city) continue;

      try {
        await prisma.location.create({
          data: {
            providerId,
            address1: data.address1 || "No address",
            address2: data.address2,
            city: data.city || "Unknown",
            state: stateMap.get(data.state_id) || "NA",
            zip: data.zip || "00000",
            country: countryMap.get(data.country_id) || "US",
            hidden: false,
          },
        });
        fallbackLocationCount++;
        locationCount++;
      } catch (e) {
        console.warn(`  Failed to create fallback location: ${e}`);
      }
    }
    if (fallbackLocationCount > 0) {
      console.log(`  (${fallbackLocationCount} from listing-level address data)`);
    }
    console.log(`  Migrated ${locationCount} locations total`);

    // ─── 8. Services (Menu) ───────────────────────────────────
    console.log("\n8. Migrating services...");
    const [legacyMenu] = await legacy.query(
      `SELECT id, listing_id, name, type, price, html_data, special, sequence
       FROM \`listing~menu\`
       WHERE hidden != 'Yes' OR hidden IS NULL`
    );

    let serviceCount = 0;
    for (const item of legacyMenu as any[]) {
      const providerId = providerIdMap.get(item.listing_id);
      if (!providerId) continue;

      const name = (item.name || "").trim();
      if (!name) continue;

      const description = item.html_data
        ? String(item.html_data).replace(/<[^>]*>/g, "").trim() || null
        : null;

      try {
        await prisma.service.create({
          data: {
            providerId,
            name,
            type: item.type || null,
            price: parsePrice(item.price),
            description,
            isSpecial: yesNoToBool(item.special),
            sortOrder: item.sequence || 0,
          },
        });
        serviceCount++;
      } catch (e) {
        console.warn(`  Failed to create service: ${e}`);
      }
    }
    console.log(`  Migrated ${serviceCount} services`);

    // ─── 9. Photos ────────────────────────────────────────────
    console.log("\n9. Migrating photos...");
    const [legacyPhotos] = await legacy.query(
      `SELECT id, listing_id, name, caption, full_image, thumb_image, sequence
       FROM photo
       WHERE hidden != 'Yes' OR hidden IS NULL`
    );

    let photoCount = 0;
    for (const p of legacyPhotos as any[]) {
      const providerId = providerIdMap.get(p.listing_id);
      if (!providerId) continue;

      const url = (p.full_image || "").trim();
      if (!url) continue;

      try {
        await prisma.photo.create({
          data: {
            providerId,
            name: p.name?.trim() || null,
            caption: p.caption?.trim() || null,
            url,
            thumbUrl: p.thumb_image?.trim() || null,
            sortOrder: p.sequence || 0,
            hidden: false,
          },
        });
        photoCount++;
      } catch (e) {
        console.warn(`  Failed to create photo: ${e}`);
      }
    }
    console.log(`  Migrated ${photoCount} photos`);

    // ─── 10. Events ───────────────────────────────────────────
    console.log("\n10. Migrating events...");
    const [legacyEvents] = await legacy.query(
      `SELECT id, listing_id, name, description, html_data, start_date, end_date,
              city, state_id, country_id, zip
       FROM listing_event
       WHERE hidden != 'Yes' OR hidden IS NULL`
    );

    let eventCount = 0;
    for (const ev of legacyEvents as any[]) {
      const providerId = providerIdMap.get(ev.listing_id);
      if (!providerId) continue;

      const name = (ev.name || "").trim();
      if (!name) continue;

      if (!isValidDate(ev.start_date)) continue;

      const description = ev.html_data
        ? String(ev.html_data).replace(/<[^>]*>/g, "").trim() || null
        : ev.description
          ? String(ev.description).trim() || null
          : null;

      try {
        await prisma.event.create({
          data: {
            providerId,
            name,
            description,
            startDate: new Date(ev.start_date),
            endDate: isValidDate(ev.end_date) ? new Date(ev.end_date) : null,
            city: ev.city?.trim() || null,
            state: stateMap.get(ev.state_id) || null,
            country: countryMap.get(ev.country_id) || "US",
            zip: ev.zip?.trim() || null,
            hidden: false,
          },
        });
        eventCount++;
      } catch (e) {
        console.warn(`  Failed to create event: ${e}`);
      }
    }
    console.log(`  Migrated ${eventCount} events`);

    // ─── 11. Coupons ──────────────────────────────────────────
    console.log("\n11. Migrating coupons...");
    const [legacyCoupons] = await legacy.query(
      `SELECT id, listing_id, name, html_data, small_print_data, expiration_date,
              promo_code, first_time_only, appointment_only, sequence
       FROM coupon
       WHERE hidden != 'Yes' OR hidden IS NULL`
    );

    let couponCount = 0;
    for (const cp of legacyCoupons as any[]) {
      const providerId = providerIdMap.get(cp.listing_id);
      if (!providerId) continue;

      const name = (cp.name || "").trim();
      if (!name) continue;

      const description = cp.html_data
        ? String(cp.html_data).replace(/<[^>]*>/g, "").trim() || null
        : null;

      const smallPrint = cp.small_print_data
        ? String(cp.small_print_data).replace(/<[^>]*>/g, "").trim() || null
        : null;

      try {
        await prisma.coupon.create({
          data: {
            providerId,
            name,
            description,
            smallPrint,
            promoCode: cp.promo_code?.trim() || null,
            expirationDate: isValidDate(cp.expiration_date)
              ? new Date(cp.expiration_date)
              : null,
            firstTimeOnly: yesNoToBool(cp.first_time_only),
            appointmentOnly: yesNoToBool(cp.appointment_only),
            hidden: false,
            sortOrder: cp.sequence || 0,
          },
        });
        couponCount++;
      } catch (e) {
        console.warn(`  Failed to create coupon: ${e}`);
      }
    }
    console.log(`  Migrated ${couponCount} coupons`);

    // ─── 12. Reviews ──────────────────────────────────────────
    console.log("\n12. Migrating reviews...");
    const [legacyReviews] = await legacy.query(
      `SELECT id, tableid, comment, status, _datetime
       FROM comment
       WHERE (hidden != 'Yes' OR hidden IS NULL) AND status = 'active'
         AND tablename_use = 'listing' AND tableid IS NOT NULL`
    );

    let reviewCount = 0;
    for (const r of legacyReviews as any[]) {
      const providerId = providerIdMap.get(r.tableid);
      if (!providerId) continue;

      const content = (r.comment || "").trim();
      if (!content) continue;

      try {
        await prisma.review.create({
          data: {
            providerId,
            content,
            status: "active",
            createdAt: isValidDate(r._datetime) ? new Date(r._datetime) : new Date(),
          },
        });
        reviewCount++;
      } catch (e) {
        console.warn(`  Failed to create review: ${e}`);
      }
    }
    console.log(`  Migrated ${reviewCount} reviews`);

    // ─── Summary ──────────────────────────────────────────────
    console.log("\n═══════════════════════════════════════════");
    console.log("  Migration complete!");
    console.log("═══════════════════════════════════════════");
    console.log(`  Categories:           ${categoryIdMap.size}`);
    console.log(`  Specialties:          ${specialtyIdMap.size}`);
    console.log(`  Providers:            ${providerIdMap.size}`);
    console.log(`  Provider-Categories:  ${provCatCount}`);
    console.log(`  Provider-Specialties: ${provSpecCount}`);
    console.log(`  Contacts:             ${contactCount}`);
    console.log(`  Locations:            ${locationCount}`);
    console.log(`  Services:             ${serviceCount}`);
    console.log(`  Photos:               ${photoCount}`);
    console.log(`  Events:               ${eventCount}`);
    console.log(`  Coupons:              ${couponCount}`);
    console.log(`  Reviews:              ${reviewCount}`);
    console.log("═══════════════════════════════════════════\n");

  } finally {
    await legacy.end();
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
