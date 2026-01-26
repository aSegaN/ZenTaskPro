import helmet from 'helmet';
import cors from 'cors';
import { Express, Request, Response, NextFunction } from 'express';

// ============================================
// CONFIGURATION
// ============================================

const isDev = process.env.NODE_ENV !== 'production';

// Liste des origines autorisées (à configurer via .env en prod)
const getAllowedOrigins = (): string[] => {
    const envOrigins = process.env.CORS_ORIGINS;
    
    if (envOrigins) {
        return envOrigins.split(',').map(origin => origin.trim());
    }
    
    // Origines par défaut en développement
    if (isDev) {
        return [
            'http://localhost:5173',  // Vite dev server
            'http://localhost:3000',  // Alternative React
            'http://localhost:4173',  // Vite preview
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000',
        ];
    }
    
    // En production sans config, bloquer tout (sécurité)
    return [];
};

// ============================================
// CONFIGURATION CORS
// ============================================

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = getAllowedOrigins();
        
        // Permettre les requêtes sans origine (Postman, curl, mobile apps)
        if (!origin) {
            if (isDev) {
                callback(null, true);
            } else {
                // En prod, on peut choisir de bloquer ou autoriser
                // Ici on autorise pour les apps mobiles/desktop
                callback(null, true);
            }
            return;
        }
        
        // Vérifier si l'origine est autorisée
        if (allowedOrigins.includes(origin) || (isDev && allowedOrigins.length === 0)) {
            callback(null, true);
        } else {
            console.warn(`🚫 CORS bloqué pour origine: ${origin}`);
            callback(new Error(`Origine non autorisée par CORS: ${origin}`));
        }
    },
    
    credentials: true, // Autoriser les cookies/auth headers
    
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
    ],
    
    exposedHeaders: [
        'RateLimit-Limit',
        'RateLimit-Remaining',
        'RateLimit-Reset',
    ],
    
    maxAge: 86400, // Cache preflight pendant 24h
    
    optionsSuccessStatus: 200, // Pour IE11
};

export const corsMiddleware = cors(corsOptions);

// ============================================
// CONFIGURATION HELMET
// ============================================

export const helmetMiddleware = helmet({
    // Content Security Policy
    contentSecurityPolicy: isDev ? false : {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // Pour les styles inline
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"], // Permettre images externes
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    
    // Cross-Origin Embedder Policy
    crossOriginEmbedderPolicy: !isDev,
    
    // Cross-Origin Opener Policy
    crossOriginOpenerPolicy: { policy: "same-origin" },
    
    // Cross-Origin Resource Policy
    crossOriginResourcePolicy: { policy: "same-site" },
    
    // DNS Prefetch Control
    dnsPrefetchControl: { allow: false },
    
    // Frameguard - Empêche le clickjacking
    frameguard: { action: "deny" },
    
    // HSTS - Force HTTPS
    hsts: isDev ? false : {
        maxAge: 31536000, // 1 an
        includeSubDomains: true,
        preload: true,
    },
    
    // IE No Open - Pour IE8+
    ieNoOpen: true,
    
    // No Sniff - Empêche le MIME sniffing
    noSniff: true,
    
    // Origin Agent Cluster
    originAgentCluster: true,
    
    // Permitted Cross Domain Policies
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    
    // Referrer Policy
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    
    // XSS Filter (obsolète mais gardé pour vieux navigateurs)
    xssFilter: true,
});

// ============================================
// MIDDLEWARE CUSTOM HEADERS
// ============================================

export const customSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Supprimer le header X-Powered-By (déjà fait par helmet mais double sécurité)
    res.removeHeader('X-Powered-By');
    
    // Ajouter des headers personnalisés
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Header personnalisé pour identifier l'API
    res.setHeader('X-API-Version', '1.4.0');
    
    // Permissions Policy (remplace Feature-Policy)
    res.setHeader('Permissions-Policy', 
        'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
    );
    
    next();
};

// ============================================
// MIDDLEWARE DE LOGGING SÉCURITÉ
// ============================================

export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
    // Logger les requêtes suspectes en production
    if (!isDev) {
        const suspiciousPatterns = [
            /\.\.\//,           // Path traversal
            /<script/i,         // XSS attempt
            /union.*select/i,   // SQL injection
            /eval\s*\(/i,       // Code injection
        ];
        
        const fullUrl = req.originalUrl;
        const body = JSON.stringify(req.body);
        
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(fullUrl) || pattern.test(body)) {
                console.warn(`🚨 Requête suspecte détectée!`);
                console.warn(`   IP: ${req.ip}`);
                console.warn(`   URL: ${fullUrl}`);
                console.warn(`   Method: ${req.method}`);
                console.warn(`   Pattern: ${pattern}`);
                break;
            }
        }
    }
    
    next();
};

// ============================================
// FONCTION D'INITIALISATION COMPLÈTE
// ============================================

export const initializeSecurity = (app: Express) => {
    // 1. Helmet en premier (headers de sécurité)
    app.use(helmetMiddleware);
    
    // 2. CORS
    app.use(corsMiddleware);
    
    // 3. Headers personnalisés
    app.use(customSecurityHeaders);
    
    // 4. Logger de sécurité
    app.use(securityLogger);
    
    console.log(`🛡️  Security initialized (${isDev ? 'development' : 'production'} mode)`);
};

// ============================================
// HELPER: Afficher la config au démarrage
// ============================================

export const logSecurityConfig = () => {
    const origins = getAllowedOrigins();
    console.log('║  🔒 Security:                                             ║');
    console.log('║  │  Helmet:     enabled                                   ║');
    console.log(`║  │  CORS:       ${origins.length > 0 ? origins.length + ' origins' : 'dev mode'}                              ║`);
    console.log(`║  │  HSTS:       ${isDev ? 'disabled (dev)' : 'enabled (1 year)'}                       ║`);
    console.log(`║  │  CSP:        ${isDev ? 'disabled (dev)' : 'enabled'}                              ║`);
};
