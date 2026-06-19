import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { requireArea } from "@/features/auth/server";
import { getMyProfile } from "@/features/profile/server";

/** Groupe (member) : session requise + onboarding complété. */
export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireArea("member");

  // Gate onboarding : un compte non finalisé est renvoyé vers /onboarding.
  const profile = await getMyProfile();
  if (profile && !profile.onboarding_completed) redirect("/onboarding");

  return <AppShell area="member">{children}</AppShell>;
}
