import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedProvider } from "@/lib/api-auth";

export async function PUT(request: NextRequest) {
  const { error, provider } = await getAuthenticatedProvider();
  if (error) return error;

  try {
    const { contacts } = await request.json();

    if (!Array.isArray(contacts)) {
      return NextResponse.json({ error: "Invalid data." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.contact.deleteMany({ where: { providerId: provider!.id } });

      if (contacts.length > 0) {
        await tx.contact.createMany({
          data: contacts.map((c: any) => ({
            providerId: provider!.id,
            firstName: c.firstName?.trim() || "",
            lastName: c.lastName?.trim() || "",
            email: c.email?.trim() || null,
            phone: c.phone?.trim() || null,
            isPublic: c.isPublic ?? true,
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating contacts:", err);
    return NextResponse.json({ error: "Failed to update." }, { status: 500 });
  }
}
