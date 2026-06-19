import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/features/profile/server";
import { OnboardingWizard } from "@/features/profile/components/onboarding-wizard";

export const metadata: Metadata = { title: "Bienvenue" };

export default async function OnboardingPage() {
  const profile = await getMyProfile();
  if (profile?.onboarding_completed) redirect("/espace-membre");

  return (
    <OnboardingWizard defaultDisplayName={profile?.display_name ?? undefined} />
  );
}
