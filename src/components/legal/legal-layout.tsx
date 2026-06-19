import { LandingFooter } from "@/components/landing/landing-footer";

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  list?: string[];
};

/**
 * Gabarit commun des pages légales (mentions, confidentialité, CGU).
 * Présentationnel, dans l'esprit du site (tokens de marque, typographie heading).
 */
export function LegalLayout({
  eyebrow,
  title,
  updated,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro?: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <div className="bg-mp-paper">
        <header className="from-mp-night to-mp-primary/80 bg-linear-to-br px-6 py-16 text-center text-white">
          <p className="text-sm font-bold tracking-wide text-white/80 uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-4xl text-white sm:text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-white/70">
            Dernière mise à jour : {updated}
          </p>
        </header>

        <article className="mx-auto max-w-3xl px-6 py-14">
          {intro && (
            <p className="text-muted-foreground mb-10 leading-relaxed">
              {intro}
            </p>
          )}
          <div className="space-y-10">
            {sections.map((s, i) => (
              <section key={s.heading}>
                <h2 className="text-foreground text-xl">
                  <span className="text-mp-primary mr-2">{i + 1}.</span>
                  {s.heading}
                </h2>
                {s.paragraphs?.map((p) => (
                  <p
                    key={p}
                    className="text-muted-foreground mt-3 leading-relaxed"
                  >
                    {p}
                  </p>
                ))}
                {s.list && (
                  <ul className="mt-3 space-y-2">
                    {s.list.map((li) => (
                      <li
                        key={li}
                        className="text-muted-foreground flex items-start gap-2 leading-relaxed"
                      >
                        <span className="text-mp-primary mt-1 text-xs font-bold">
                          ✦
                        </span>
                        {li}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>
      </div>
      <LandingFooter />
    </>
  );
}
