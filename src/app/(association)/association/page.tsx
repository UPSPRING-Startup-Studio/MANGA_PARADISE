import type { Metadata } from "next";

export const metadata: Metadata = { title: "Association" };

export default function AssociationHomePage() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-4xl">Back-office association</h1>
      <p className="text-muted-foreground max-w-prose">
        Zone protégée. Le back-office association, le form builder
        d&apos;adhésion et le bénévolat sont construits à l&apos;étape 3.
      </p>
    </div>
  );
}
