# ZenTask Pro — Audit général & notation

Analyse au 16/09/2026, après la refonte UI (thème dual clair/sombre).
Barème : **10 = niveau Linear / Asana en production**. Note globale pondérée : **6,4 / 10**.

---

## Notes par dimension

| Dimension | Note /10 | Poids |
|---|---|---|
| UI / UX | 8,0 | 15 % |
| Architecture front | 7,0 | 12 % |
| Architecture back / API | 7,0 | 12 % |
| Sécurité | 5,5 | 15 % |
| Qualité de code | 6,0 | 12 % |
| Fonctionnalités | 6,0 | 14 % |
| Performance | 6,0 | 8 % |
| Production-readiness | 4,5 | 8 % |
| Modèle de données / scalabilité | 6,5 | 4 % |
| **Global pondéré** | **6,4** | 100 % |

---

## Détail

### UI / UX — 8,0
Après refonte : système de tokens sémantiques, thème clair/sombre cohérent avec bascule persistée, sobriété alignée sur les références (Linear, Vercel). Écarts restants : pas de raccourcis clavier réels (le `⌘K` est décoratif), états de chargement et états vides inégaux selon les écrans, pas de mode densité, pas d'onboarding.

### Architecture front — 7,0
React 19 + Vite, séparation `components / services / hooks` correcte, lazy-loading de plusieurs vues. Points faibles : `App.tsx` concentre l'état global, les handlers CRUD et les modales ; pas de gestionnaire d'état (Context/Zustand/Redux) ; pas de routeur (navigation par `useState`), donc pas d'URL par vue ni de deep-linking.

### Architecture back / API — 7,0
Express + Prisma bien structuré : `routes / controllers / services / middlewares`. REST lisible. Manques : pas de pagination, pas de temps réel (websocket), pas de couche cache, pas de versionnage d'API.

### Sécurité — 5,5
Acquis : bcrypt, JWT avec refresh et expiration, helmet, rate-limiting, validation zod, middleware de sécurité et d'upload.
Failles / risques :
- **Clé Gemini injectée dans le bundle client** (`vite.config.ts` → `process.env.API_KEY` / `GEMINI_API_KEY`) : exposée à tout visiteur. Les appels IA doivent passer par le backend.
- JWT stocké en `localStorage` : vulnérable au XSS (préférer cookie httpOnly).
- `prisma/dev.db` non ignoré par git : risque d'exposer les hash de tous les comptes s'il est poussé.

### Qualité de code — 6,0
Code lisible, commenté, typé TypeScript. Faiblesses : **aucun test** (`"test": echo no test specified`), usage fréquent de `any`, logique métier dans le composant racine, pas de lint/format/CI visibles.

### Fonctionnalités — 6,0
Couverture solide pour solo/PME : projets, tâches, sous-tâches, commentaires, pièces jointes, rôles (ADMIN/MANAGER/CONTRIBUTOR), calendrier, assistant IA, logs.
Écart avec le top tier : pas de collaboration temps réel, pas de présence multi-utilisateur, pas de vues avancées (timeline, Gantt, board configurable), recherche non fonctionnelle, notifications uniquement locales, pas d'undo, pas d'historique/audit.

### Performance — 6,0
Lazy-loading partiel. Mais **bundle unique ~672 Ko** (pas de découpage vendor), **Tailwind chargé en CDN au runtime** (déconseillé en production, recompile côté client, avertissement console), avatars servis en externe.

### Production-readiness — 4,5
SQLite (adapté au dev, pas à la charge), pas de tests, pas de CI/CD ni de monitoring observés, `Paramètres` et la recherche « intelligente » décoratifs. Manque un pipeline de build/déploiement et une base de données de production.

### Modèle de données / scalabilité — 6,5
Schéma Prisma propre et relationnel (User, Project, Task, SubTask, Comment, Attachment). SQLite plafonne : migration PostgreSQL nécessaire pour le multi-utilisateur à l'échelle.

---

## Les 5 écarts prioritaires vers le « top tier »

1. **Clé API Gemini exposée côté client** — corriger en priorité : proxy backend, clé jamais dans le bundle.
2. **Aucun test automatisé** — introduire Vitest (front) + tests d'API (back), au moins sur l'auth et le CRUD.
3. **Pas de temps réel / collaboration** — websockets, présence, mises à jour instantanées : le marqueur n°1 des leaders.
4. **Tailwind CDN + bundle monolithique** — compiler Tailwind en local, découper le vendor, viser < 250 Ko initial.
5. **SQLite + absence de CI/CD/monitoring** — PostgreSQL, pipeline de déploiement, logs et alertes.

## Ce qui est déjà au niveau
- Identité visuelle et cohérence clair/sombre après refonte.
- Découpage backend (services/controllers/middlewares) et validation zod.
- Fondamentaux d'authentification (bcrypt, refresh token, expiration).

---

## Synthèse
Excellent MVP / projet individuel, au-dessus de la moyenne des apps de gestion de tâches maison, surtout visuellement. Ce qui le sépare du top tier mondial n'est plus l'apparence mais la **profondeur** : temps réel, robustesse (tests, CI, observabilité), sécurité de production et collaboration.
