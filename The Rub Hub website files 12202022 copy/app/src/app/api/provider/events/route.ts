import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedProvider } from "@/lib/api-auth";

export async function PUT(request: NextRequest) {
  const { error, provider } = await getAuthenticatedProvider();
  if (error) return error;

  try {
    const { events } = await request.json();

    if (!Array.isArray(events)) {
      return NextResponse.json({ error: "Invalid data." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.event.deleteMany({ where: { providerId: provider!.id } });

      if (events.length > 0) {
        await tx.event.createMany({
          data: events.map((e: any) => ({
            providerId: provider!.id,
            name: e.name?.trim() || "",
            description: e.description?.trim() || null,
            startDate: new Date(e.startDate),
            endDate: e.endDate ? new Date(e.endDate) : null,
            city: e.city?.trim() || null,
            state: e.state?.trim() || null,
            hidden: e.hidden ?? false,
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating events:", err);
    return NextResponse.json({ error: "Failed to update." }, { status: 500 });
  }
}
