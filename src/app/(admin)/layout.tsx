import { AppShell } from "@/components/layout/app-shell";
import { requireArea } from "@/features/auth/server";

/** Groupe (admin) : réservé aux rôles `admin` et `moderator`. */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireArea("admin");
  return <AppShell area="admin">{children}</AppShell>;
}
