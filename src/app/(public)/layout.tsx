import { PublicShell } from "@/components/layout/public-shell";

/** Groupe (public) : pages accessibles sans authentification. */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
