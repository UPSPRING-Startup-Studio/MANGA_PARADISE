import { AppShell } from "@/components/layout/app-shell";
import { requireArea } from "@/features/auth/server";

/**
 * Groupe (association) : nécessite une session ; l'appartenance et le rôle dans
 * une association précise sont vérifiés par la RLS et des gardes par page.
 */
export default async function AssociationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireArea("association");
  return <AppShell area="association">{children}</AppShell>;
}
