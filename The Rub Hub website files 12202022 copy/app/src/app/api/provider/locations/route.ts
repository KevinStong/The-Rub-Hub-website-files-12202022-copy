import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedProvider } from "@/lib/api-auth";

export async function PUT(request: NextRequest) {
  const { error, provider } = await getAuthenticatedProvider();
  if (error) return error;

  try {
    const { locations } = await request.json();

    if (!Array.isArray(locations)) {
      return NextResponse.json({ error: "Invalid data." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.location.deleteMany({ where: { providerId: provider!.id } });

      if (locations.length > 0) {
        await tx.location.createMany({
          data: locations.map((l: any) => ({
            providerId: provider!.id,
            name: l.name?.trim() || null,
            address1: l.address1?.trim() || "",
            address2: l.address2?.trim() || null,
            city: l.city?.trim() || "",
            state: l.state?.trim() || "",
            zip: l.zip?.trim() || "",
            country: l.country?.trim() || "US",
            hidden: l.hidden ?? false,
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating locations:", err);
    return NextResponse.json({ error: "Failed to update." }, { status: 500 });
  }
}
