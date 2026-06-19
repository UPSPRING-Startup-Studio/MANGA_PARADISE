import { requireAuth } from "@/features/auth/server";

/** Onboarding : authentifié, coquille minimale centrée (sans nav). */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
