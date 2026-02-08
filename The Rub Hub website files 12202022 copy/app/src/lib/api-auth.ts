import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function getAuthenticatedProvider() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), provider: null };
  }

  const provider = await prisma.provider.findUnique({
    where: { userId: parseInt(session.user.id) },
  });

  if (!provider) {
    return { error: NextResponse.json({ error: "No provider profile found" }, { status: 404 }), provider: null };
  }

  return { error: null, provider };
}
