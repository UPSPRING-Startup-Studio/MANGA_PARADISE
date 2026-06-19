import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-4 py-16">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-4xl">Rejoindre Manga Paradise</h1>
        <p className="text-muted-foreground text-sm">
          Crée ton compte pour rejoindre la communauté.
        </p>
      </div>
      <RegisterForm next={next} />
    </div>
  );
}
