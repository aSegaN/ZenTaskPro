import { initSentry } from './utils/sentry';
initSentry();

import app from './app';
import { logSecurityConfig } from './middlewares/securityMiddleware';
import { logRateLimitConfig } from './middlewares/rateLimitMiddleware';
import { logUploadConfig } from './middlewares/uploadMiddleware';

// ============================================
// CONFIGURATION
// ============================================

const PORT = process.env.PORT || 4000;

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================

app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║           🚀 ZenTask Pro API v3.0.0                      ║');
    console.log('║              Architecture en couches                     ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  🌐 Server:     http://localhost:${PORT}                    ║`);
    console.log('║  🔐 Auth:       JWT (2h expiration)                      ║');
    console.log('║  ✅ Validation: Zod schemas                              ║');
    console.log('║  💾 Database:   SQLite via Prisma                        ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    logSecurityConfig();
    console.log('╠══════════════════════════════════════════════════════════╣');
    logRateLimitConfig();
    console.log('╠══════════════════════════════════════════════════════════╣');
    logUploadConfig();
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  📁 Architecture:                                        ║');
    console.log('║      • controllers/  → Logique HTTP                      ║');
    console.log('║      • services/     → Logique métier                    ║');
    console.log('║      • routes/       → Définition routes                 ║');
    console.log('║      • middlewares/  → Auth, validation, sécurité        ║');
    console.log('║      • schemas/      → Validation Zod                    ║');
    console.log('║      • utils/        → Prisma, errors, formatters        ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  📡 Endpoints:                                           ║');
    console.log('║      • /api/auth        → login, register, me, refresh   ║');
    console.log('║      • /api/users       → CRUD utilisateurs              ║');
    console.log('║      • /api/projects    → CRUD projets                   ║');
    console.log('║      • /api/tasks       → CRUD tâches + workflow         ║');
    console.log('║      • /api/attachments → Upload/delete fichiers         ║');
    console.log('║      • /api/health      → Health check                   ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
});
