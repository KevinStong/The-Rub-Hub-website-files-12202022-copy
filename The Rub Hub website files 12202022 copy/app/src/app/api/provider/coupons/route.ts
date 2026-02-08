import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedProvider } from "@/lib/api-auth";

export async function PUT(request: NextRequest) {
  const { error, provider } = await getAuthenticatedProvider();
  if (error) return error;

  try {
    const { coupons } = await request.json();

    if (!Array.isArray(coupons)) {
      return NextResponse.json({ error: "Invalid data." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.coupon.deleteMany({ where: { providerId: provider!.id } });

      if (coupons.length > 0) {
        await tx.coupon.createMany({
          data: coupons.map((c: any) => ({
            providerId: provider!.id,
            name: c.name?.trim() || "",
            description: c.description?.trim() || null,
            smallPrint: c.smallPrint?.trim() || null,
            promoCode: c.promoCode?.trim() || null,
            expirationDate: c.expirationDate ? new Date(c.expirationDate) : null,
            firstTimeOnly: c.firstTimeOnly ?? false,
            appointmentOnly: c.appointmentOnly ?? false,
            hidden: c.hidden ?? false,
            sortOrder: c.sortOrder ?? 0,
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating coupons:", err);
    return NextResponse.json({ error: "Failed to update." }, { status: 500 });
  }
}
