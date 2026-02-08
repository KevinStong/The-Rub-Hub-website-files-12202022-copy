import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedProvider } from "@/lib/api-auth";

export async function PUT(request: NextRequest) {
  const { error, provider } = await getAuthenticatedProvider();
  if (error) return error;

  try {
    const { name, bio } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    await prisma.provider.update({
      where: { id: provider!.id },
      data: {
        name: name.trim(),
        bio: bio?.trim() || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating bio:", err);
    return NextResponse.json({ error: "Failed to update." }, { status: 500 });
  }
}
