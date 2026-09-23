# ZenTask Pro — Plan d'action vers le top tier

Contexte : dev solo, temps fragmenté, sans capital, offline-first.
Chaque tâche est découpée pour tenir en session courte et survivre à une interruption.
Priorités : **P0** bloquant · **P1** important · **P2** différenciation.
Effort : **S** < ½ j · **M** 1–2 j · **L** 3–5 j (équivalents).

Point de départ (audit) : **6,4 / 10**. Cible après Phases 0→3 : **~8,2 / 10**.

---

## Phase 0 — Sécurité & hygiène (P0, avant tout le reste)

- **0.1 — Sortir la clé Gemini du client** (S)
  Créer une route backend (`POST /ai/analyze`) qui appelle Gemini côté serveur. Supprimer `process.env.API_KEY` / `GEMINI_API_KEY` de `vite.config.ts`. Le front appelle le backend, jamais Gemini directement.
- **0.2 — Hygiène git** (S)
  Ajouter `prisma/dev.db` et `.env*` au `.gitignore`. Si `dev.db` a déjà été poussé, purger l'historique (git filter-repo) et considérer les mots de passe comme compromis.
- **0.3 — JWT en cookie httpOnly** (M)
  Passer le token de `localStorage` à un cookie `httpOnly` + `SameSite=Lax` + `Secure`. Adapter l'intercepteur axios et le refresh.
- **0.4 — Autorisations serveur par rôle** (M)
  Vérifier ADMIN/MANAGER/CONTRIBUTOR sur chaque route sensible côté backend, indépendamment de l'UI.

## Phase 1 — Qualité & filet de sécurité (P0/P1)

- **1.1 — Lint + format + TS strict** (S) : ESLint, Prettier, `noImplicitAny`, `strict: true`.
- **1.2 — Tests front** (M) : Vitest + React Testing Library sur auth et CRUD tâche.
- **1.3 — Tests API** (M) : Supertest sur auth + CRUD projets/tâches.
- **1.4 — CI** (S) : GitHub Actions (lint + tests + build) à chaque push.

## Phase 2 — Prêt pour la production (P1)

- **2.1 — Tailwind local** (S) : retirer le CDN, compiler Tailwind au build.
- **2.2 — Découpage bundle** (S) : `manualChunks` vendor, cible < 250 Ko initial.
- **2.3 — PostgreSQL** (M) : migrer SQLite → Postgres (Neon ou Supabase, free tier). Adapter `schema.prisma` + migrations.
- **2.4 — Déploiement** (M) : Railway / Render / Fly.io ou VPS. Variables d'env, build front + back. Coût 0–5 $/mois.
- **2.5 — Observabilité** (S) : logs structurés (pino) + Sentry (free tier).

## Phase 3 — Architecture front (P1)

- **3.1 — Routeur** (M) : react-router, une URL par vue, deep-linking.
- **3.2 — État global** (M) : sortir state + handlers de `App.tsx` vers Zustand (ou Context + hooks dédiés).
- **3.3 — Couche data** (M) : TanStack Query (cache, refetch, invalidation, optimistic).

## Phase 4 — Fonctionnalités différenciantes (P2)

- **4.1 — Recherche réelle** (M) : ⌘K fonctionnel (cmdk) sur tâches/projets.
- **4.2 — Temps réel** (L) : Socket.io, mises à jour instantanées + présence multi-utilisateur. *C'est le marqueur n°1 du top tier.*
- **4.3 — Notifications serveur** (M) : persistées en base, pas seulement locales.
- **4.4 — UI optimiste + undo** (M) sur les actions clés.
- **4.5 — Vues avancées** (L) : board configurable, timeline/Gantt.

## Phase 5 — Finitions UX (P2)

- **5.1 — États vides / chargement** (M) : skeletons cohérents partout.
- **5.2 — Accessibilité** (M) : focus visible, ARIA, navigation clavier.
- **5.3 — Raccourcis clavier + onboarding** (M).

---

## Séquencement conseillé

1. Phase 0 en entier (sécurité) — non négociable avant de publier.
2. Phase 1 (1.1 → 1.4) : le filet qui permet de refactorer sans rien casser.
3. Phase 2 : rendre l'app réellement déployable.
4. Phases 3 → 5 : tâche par tâche, dans l'ordre de valeur perçue.

## Impact estimé sur la note

| Étape | Note globale visée |
|---|---|
| Aujourd'hui | 6,4 |
| Après Phase 0 + 1 | ~7,3 |
| Après Phase 2 + 3 | ~8,2 |
| Après Phase 4 (temps réel) | ~8,8 (« top tier » ressenti) |

## Outils, coût 0 (ou free tier)
Vitest, RTL, Supertest, ESLint/Prettier, GitHub Actions, Neon/Supabase (Postgres), Sentry, Socket.io, react-router, Zustand, TanStack Query, cmdk. Seul poste éventuel : hébergement 0–5 $/mois.
