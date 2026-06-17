# Design System — « Pop Sanctuary » (charte 2026)

Source : `src/app/globals.css`. Référence complète des utilitaires de l'ancienne app : `legacy/src/index.css`.

## Couleurs de marque

| Token | Valeur | Usage |
|---|---|---|
| `--mp-primary` | `#DC1E44` (cinabre) | couleur principale, CTA, liens |
| `--mp-coral` | `#F25353` | accent chaud |
| `--mp-orange` | `#F7945B` | accent chaud |
| `--mp-saffron` | `#FFD15B` | accent / highlights |
| `--mp-paper` | `#F8FBFF` | fond clair par défaut |
| `--mp-cloud` / `--mp-sky` / `--mp-sand` | bleus clairs / sable | fonds de sections |
| `--mp-ink` | `#334155` | texte principal |
| `--mp-night` | `#0F1B2D` | fond sombre (Pro / Admin) |

Sémantiques : `--mp-success`, `--mp-warning`, `--mp-danger`, `--mp-info`, `--mp-violet`.

## Tokens shadcn

Les tokens sémantiques (`--background`, `--foreground`, `--primary`, `--card`, `--border`…) sont mappés sur la marque en mode clair, et sur `mp-night` en mode sombre (`.dark`). Utilitaires Tailwind : `bg-primary`, `text-muted-foreground`, `bg-mp-cloud`, `text-mp-ink`, etc.

## Typographie

- **Titres** (`h1`–`h4`) : **Barlow Condensed** 800 italique (`--font-heading`).
- **Corps** : **Poppins** (`--font-sans`).
- **Mono** : JetBrains Mono (`--font-mono`).
- Chargées via `next/font` dans `app/layout.tsx`.

## Rayons

`--radius: 1rem` (cards arrondies). Échelle : `--radius-sm/md/lg/xl`.

## Mode sombre

Stratégie classe (`next-themes`, `attribute="class"`). Défaut : clair. La variante sombre cible surtout les espaces Pro / Admin.
