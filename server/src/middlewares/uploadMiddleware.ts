import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// ============================================
// CONFIGURATION
// ============================================

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
const MAX_FILES = 5;

// Types MIME autorisés
const ALLOWED_MIME_TYPES = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
];

// Extensions bloquées (sécurité)
const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.php', '.js', '.vbs'];

// ============================================
// SETUP DIRECTORIES
// ============================================

/**
 * Créer les dossiers d'upload s'ils n'existent pas
 */
export const ensureUploadDirs = (): void => {
    const dirs = ['tasks', 'subtasks', 'comments', 'avatars'];
    dirs.forEach(dir => {
        const fullPath = path.join(UPLOAD_DIR, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`📁 Dossier créé: ${fullPath}`);
        }
    });
};

// ============================================
// STORAGE CONFIGURATION
// ============================================

// Variable pour stocker le type d'upload courant
let currentUploadType: 'tasks' | 'subtasks' | 'comments' | 'avatars' = 'tasks';

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadPath = path.join(UPLOAD_DIR, currentUploadType);
        cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const hash = crypto.randomBytes(8).toString('hex');
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const ext = path.extname(safeName);
        const filename = `${timestamp}-${hash}${ext}`;
        cb(null, filename);
    },
});

// ============================================
// FILE FILTER
// ============================================

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Vérifier les extensions bloquées
    if (BLOCKED_EXTENSIONS.includes(ext)) {
        return cb(new Error(`Extension ${ext} non autorisée pour des raisons de sécurité`));
    }
    
    // Vérifier le type MIME
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error(`Type de fichier ${file.mimetype} non autorisé`));
    }
    
    cb(null, true);
};

// ============================================
// MULTER INSTANCE
// ============================================

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_FILES,
    },
});

// ============================================
// HELPERS
// ============================================

/**
 * Middleware pour définir le type d'upload
 */
export const setUploadType = (type: 'tasks' | 'subtasks' | 'comments' | 'avatars') => {
    return (_req: Request, _res: Response, next: NextFunction) => {
        currentUploadType = type;
        next();
    };
};

/**
 * Formater les infos d'un fichier uploadé
 */
export const formatUploadedFile = (file: Express.Multer.File) => ({
    name: file.originalname,
    url: `/uploads/${currentUploadType}/${file.filename}`,
    type: getFileType(file.mimetype),
    size: file.size,
});

/**
 * Déterminer le type de fichier
 */
export const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf') || mimeType.includes('word') || 
        mimeType.includes('excel') || mimeType.includes('powerpoint') || 
        mimeType.includes('text')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
    return 'other';
};

/**
 * Supprimer un fichier par son URL
 */
export const deleteFileByUrl = (url: string): boolean => {
    try {
        // Construire le chemin absolu depuis l'URL relative
        const filePath = path.join(process.cwd(), url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Fichier supprimé: ${url}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Erreur suppression fichier ${url}:`, error);
        return false;
    }
};

// ============================================
// ERROR HANDLER
// ============================================

/**
 * Middleware de gestion des erreurs Multer
 */
export const handleMulterError = (err: any, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
                code: 'FILE_TOO_LARGE'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: `Trop de fichiers (max ${MAX_FILES})`,
                code: 'TOO_MANY_FILES'
            });
        }
        return res.status(400).json({
            error: err.message,
            code: 'UPLOAD_ERROR'
        });
    }
    
    if (err) {
        return res.status(400).json({
            error: err.message,
            code: 'UPLOAD_ERROR'
        });
    }
    
    next();
};

// ============================================
// LOGGING
// ============================================

export const logUploadConfig = () => {
    console.log('║  📎 Uploads:                                              ║');
    console.log(`║      • Directory: ${UPLOAD_DIR.padEnd(35)}║`);
    console.log(`║      • Max size:  ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB                                  ║`);
    console.log(`║      • Max files: ${MAX_FILES}                                    ║`);
};
