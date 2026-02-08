import { auth } from "@/lib/auth";

export async function getOwnerStatus(providerSlug: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  return session.user.providerSlug === providerSlug;
}
