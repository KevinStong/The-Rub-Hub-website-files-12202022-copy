import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedProvider } from "@/lib/api-auth";

export async function PUT(request: NextRequest) {
  const { error, provider } = await getAuthenticatedProvider();
  if (error) return error;

  try {
    const { services } = await request.json();

    if (!Array.isArray(services)) {
      return NextResponse.json({ error: "Invalid data." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.service.deleteMany({ where: { providerId: provider!.id } });

      if (services.length > 0) {
        await tx.service.createMany({
          data: services.map((s: any) => ({
            providerId: provider!.id,
            name: s.name?.trim() || "",
            type: s.type?.trim() || null,
            price: s.price != null ? s.price : null,
            description: s.description?.trim() || null,
            isSpecial: s.isSpecial ?? false,
            sortOrder: s.sortOrder ?? 0,
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating services:", err);
    return NextResponse.json({ error: "Failed to update." }, { status: 500 });
  }
}
