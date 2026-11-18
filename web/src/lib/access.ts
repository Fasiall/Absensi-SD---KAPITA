import "server-only";

import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

/** Setara get_accessible_classes(): admin melihat semua, guru hanya kelas miliknya. */
export async function getAccessibleClasses(user: SessionUser) {
  return prisma.schoolClass.findMany({
    where: user.role === "admin" ? {} : { guruId: user.id },
    orderBy: { namaKelas: "asc" },
  });
}

/** Setara can_access_class(). */
export function canAccessClass(
  user: SessionUser,
  schoolClass: { guruId: number | null } | null | undefined,
): boolean {
  if (user.role === "admin") return true;
  return Boolean(schoolClass && schoolClass.guruId === user.id);
}
