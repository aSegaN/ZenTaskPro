# ZenTask Pro — Phase 2 : mise en production

Ce guide couvre ce qui a été **livré et vérifié** (2.1, 2.2, 2.5) et ce qui est **à exécuter de ton côté** (2.3 PostgreSQL, 2.4 déploiement), car ces deux dernières passent par tes comptes cloud et ne peuvent pas être testées à distance.

---

## Livré et vérifié (build à l'appui)

### 2.1 — Tailwind compilé localement
- Ajout de `tailwind.config.js`, `postcss.config.js`, `index.css` (tokens + styles), importé dans `index.tsx`.
- `index.html` : CDN Tailwind supprimé (fini l'avertissement « should not be used in production »). L'anti-FOUC et les polices sont conservés.
- Build : CSS compilé ≈ 52 Ko (8,7 Ko gzip). Rendu identique clair/sombre (vérifié sur le build de prod).

### 2.2 — Découpage du bundle
- `vite.config.ts` : `manualChunks` sépare `vendor-react`, `vendor-icons`, `vendor-http` du code applicatif.
- Poids initial ≈ **118 Ko gzip** (react 69 + app 21 + http 19 + css 9), sous la cible de 250 Ko. Les vues secondaires (Calendar, UserManagement…) restent en chunks lazy.

### 2.5 — Observabilité
- `src/utils/logger.ts` : logs structurés **pino** (niveau via `LOG_LEVEL`).
- `src/utils/sentry.ts` : **Sentry** initialisé seulement si `SENTRY_DSN` est défini (no-op sinon).
- `app.ts` : logs par requête (`pino-http`) + capture des erreurs vers Sentry dans le handler global.
- `api.ts` (front) : l'URL de l'API vient de `VITE_API_URL` (fallback `localhost:4000`), nécessaire pour le déploiement.

**Après un `git pull` :** `cd client && npm install` puis `cd ../server && npm install` (nouvelles dépendances : tailwindcss/postcss/autoprefixer côté front ; pino/pino-http/@sentry/node côté back).

---

## 2.3 — Migration PostgreSQL (à exécuter)

> Ne pas basculer tant que la base Postgres n'existe pas : le dev SQLite continue de fonctionner d'ici là.

1. **Créer une base gratuite** : Neon (neon.tech) ou Supabase (supabase.com). Récupérer l'URL de connexion (format `postgresql://…?sslmode=require`).
2. **Configurer** `server/.env` : mettre `DATABASE_URL` sur cette URL (voir `server/.env.example`).
3. **Changer le provider** dans `server/prisma/schema.prisma` :
   ```prisma
   datasource db {
     provider = "postgresql"   // était "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
   Le schéma actuel est compatible (aucune enum native, dates en `DateTime`, ids en `cuid`).
4. **Régénérer les migrations** (les migrations SQLite ne s'appliquent pas telles quelles à Postgres) :
   ```bash
   cd server
   rm -rf prisma/migrations
   npx prisma migrate dev --name init_postgres
   npm run seed
   ```
5. **Vérifier** : `npm run dev`, se connecter, créer une tâche.

À garder : SQLite reste pratique en local. Tu peux utiliser deux `.env` (un local SQLite, un prod Postgres) plutôt que de committer l'URL Postgres.

---

## 2.4 — Déploiement (à exécuter)

Architecture : **front statique** (build Vite) + **API Node** + **Postgres managé**.

### Backend (Render / Railway / Fly.io)
- Build : `npm install && npm run build`
- Start : `npm run start` (lance `dist/index.js`)
- Avant le premier start : `npx prisma migrate deploy` (hook de release) puis `npm run seed` une seule fois.
- Variables d'env : tout `server/.env.example` (surtout `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS` = l'URL du front, `GEMINI_API_KEY`, `SENTRY_DSN`).

### Frontend (Vercel / Netlify / Cloudflare Pages)
- Build : `npm install && npm run build` → sert le dossier `dist/`.
- Variable d'env : `VITE_API_URL` = l'URL publique de l'API (ex. `https://zentask-api.onrender.com/api`).
- SPA : rediriger toutes les routes vers `index.html`.

### Points de vigilance
- `CORS_ORIGINS` côté back doit contenir l'origine exacte du front (https), sinon les appels seront bloqués.
- Refaire la Phase 0.3 (session/refresh) avant d'ouvrir à des utilisateurs réels : le rafraîchissement de jeton échoue après expiration.
- Ne jamais committer les `.env` réels ni `dev.db` (déjà couverts par `.gitignore`).

---

## Rappels des tâches non faites
- **0.3** — correctif session expirée (création de tâche → 401) : non corrigé, à traiter.
- **CI** — `.github/workflows/ci.yml` à déposer manuellement (écriture `.github/` bloquée à distance).
