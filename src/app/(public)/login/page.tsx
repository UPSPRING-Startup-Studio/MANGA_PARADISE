import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-4 py-16">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-4xl">Connexion</h1>
        <p className="text-muted-foreground text-sm">
          Content de te revoir dans le sanctuaire.
        </p>
      </div>
      <LoginForm next={next} />
    </div>
  );
}
