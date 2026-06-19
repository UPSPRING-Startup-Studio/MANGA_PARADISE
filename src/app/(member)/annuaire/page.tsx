import type { Metadata } from "next";
import { getMembers } from "@/features/directory/server";
import { MembersView } from "@/features/directory/components/members-view";

export const metadata: Metadata = { title: "Annuaire" };

export default async function AnnuairePage() {
  const members = await getMembers();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl">Annuaire</h1>
        <p className="text-muted-foreground">
          Découvre les membres de la communauté.
        </p>
      </div>
      <MembersView members={members} />
    </div>
  );
}
