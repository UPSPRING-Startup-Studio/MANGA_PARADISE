/**
 * Sert /llms.txt (standard llmstxt.org) : un Markdown avec un H1 et des liens
 * pour aider les agents IA / crawlers à comprendre le site. Les URLs sont
 * construites depuis l'hôte de la requête (pas de domaine en dur).
 */
export function GET(request: Request): Response {
  const { origin } = new URL(request.url);

  const body = `# Manga Paradise

> Le 1er réseau social de la pop culture japonaise : otaku, cosplay, gaming et créateurs. Plateforme communautaire de l'association Manga Paradise (loi 1901), basée à Nice.

## Pages principales

- [Accueil](${origin}/)
- [Connexion / inscription](${origin}/login)
- [Mentions légales](${origin}/mentions-legales)
- [Politique de confidentialité](${origin}/confidentialite)
- [Conditions générales d'utilisation](${origin}/cgu)
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
