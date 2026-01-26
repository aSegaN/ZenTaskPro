import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// ============================================
// CONFIGURATION
// ============================================

// Dossier de stockage des uploads
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB par défaut

// Créer le dossier uploads s'il n'existe pas
export const ensureUploadDirs = () => {
    const dirs = [
        UPLOAD_DIR,
        path.join(UPLOAD_DIR, 'tasks'),
        path.join(UPLOAD_DIR, 'subtasks'),
        path.join(UPLOAD_DIR, 'comments'),
        path.join(UPLOAD_DIR, 'avatars'),
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Dossier créé: ${dir}`);
        }
    });
};

// ============================================
// TYPES MIME AUTORISÉS
// ============================================

const ALLOWED_MIME_TYPES: { [key: string]: string[] } = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
    ],
    archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
};

const ALL_ALLOWED_TYPES = [
    ...ALLOWED_MIME_TYPES.image,
    ...ALLOWED_MIME_TYPES.document,
    ...ALLOWED_MIME_TYPES.archive,
];

// ============================================
// CONFIGURATION MULTER - STOCKAGE
// ============================================

const storage = multer.diskStorage({
    destination: (req: Request, file, cb) => {
        // Déterminer le sous-dossier selon le type d'upload
        const uploadType = (req as any).uploadType || 'tasks';
        const destDir = path.join(UPLOAD_DIR, uploadType);
        
        // S'assurer que le dossier existe
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        cb(null, destDir);
    },
    
    filename: (req: Request, file, cb) => {
        // Générer un nom de fichier unique
        const uniqueSuffix = crypto.randomBytes(8).toString('hex');
        const timestamp = Date.now();
        const ext = path.extname(file.originalname).toLowerCase();
        const safeName = file.originalname
            .replace(ext, '')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .substring(0, 50);
        
        const filename = `${timestamp}-${safeName}-${uniqueSuffix}${ext}`;
        cb(null, filename);
    },
});

// ============================================
// FILTRE DE FICHIERS
// ============================================

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Vérifier le type MIME
    if (!ALL_ALLOWED_TYPES.includes(file.mimetype)) {
        cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`));
        return;
    }
    
    // Vérifier l'extension
    const ext = path.extname(file.originalname).toLowerCase();
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.php', '.js', '.vbs'];
    
    if (dangerousExtensions.includes(ext)) {
        cb(new Error(`Extension de fichier non autorisée: ${ext}`));
        return;
    }
    
    cb(null, true);
};

// ============================================
// INSTANCES MULTER
// ============================================

// Upload général (max 10MB, 5 fichiers)
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 5,
    },
});

// Upload avatar (max 2MB, 1 fichier, images only)
export const uploadAvatar = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.image.includes(file.mimetype)) {
            cb(new Error('Seules les images sont autorisées pour les avatars'));
            return;
        }
        cb(null, true);
    },
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
        files: 1,
    },
});

// ============================================
// MIDDLEWARE POUR DÉFINIR LE TYPE D'UPLOAD
// ============================================

export const setUploadType = (type: 'tasks' | 'subtasks' | 'comments' | 'avatars') => {
    return (req: Request, res: Response, next: NextFunction) => {
        (req as any).uploadType = type;
        next();
    };
};

// ============================================
// HELPERS
// ============================================

/**
 * Obtenir l'URL publique d'un fichier
 */
export const getFileUrl = (filename: string, type: string = 'tasks'): string => {
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
    return `${baseUrl}/uploads/${type}/${filename}`;
};

/**
 * Obtenir le chemin complet d'un fichier
 */
export const getFilePath = (filename: string, type: string = 'tasks'): string => {
    return path.join(UPLOAD_DIR, type, filename);
};

/**
 * Supprimer un fichier du disque
 */
export const deleteFile = (filepath: string): boolean => {
    try {
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            console.log(`🗑️ Fichier supprimé: ${filepath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Erreur suppression fichier: ${filepath}`, error);
        return false;
    }
};

/**
 * Supprimer un fichier par son URL
 */
export const deleteFileByUrl = (url: string): boolean => {
    try {
        // Extraire le chemin depuis l'URL
        const urlParts = url.split('/uploads/');
        if (urlParts.length < 2) return false;
        
        const relativePath = urlParts[1];
        const filepath = path.join(UPLOAD_DIR, relativePath);
        return deleteFile(filepath);
    } catch (error) {
        console.error(`❌ Erreur parsing URL: ${url}`, error);
        return false;
    }
};

/**
 * Obtenir le type de fichier depuis le MIME type
 */
export const getFileType = (mimetype: string): string => {
    if (ALLOWED_MIME_TYPES.image.includes(mimetype)) return 'image';
    if (ALLOWED_MIME_TYPES.document.includes(mimetype)) return 'document';
    if (ALLOWED_MIME_TYPES.archive.includes(mimetype)) return 'archive';
    return 'other';
};

/**
 * Formater un fichier uploadé pour la réponse API
 */
export const formatUploadedFile = (file: Express.Multer.File, type: string = 'tasks') => ({
    name: file.originalname,
    filename: file.filename,
    url: getFileUrl(file.filename, type),
    type: getFileType(file.mimetype),
    mimetype: file.mimetype,
    size: file.size,
});

// ============================================
// MIDDLEWARE DE GESTION D'ERREURS MULTER
// ============================================

export const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                res.status(400).json({
                    error: 'Fichier trop volumineux',
                    code: 'FILE_TOO_LARGE',
                    message: `La taille maximale autorisée est de ${MAX_FILE_SIZE / 1024 / 1024}MB`,
                });
                return;
            case 'LIMIT_FILE_COUNT':
                res.status(400).json({
                    error: 'Trop de fichiers',
                    code: 'TOO_MANY_FILES',
                    message: 'Vous ne pouvez uploader que 5 fichiers à la fois',
                });
                return;
            case 'LIMIT_UNEXPECTED_FILE':
                res.status(400).json({
                    error: 'Champ de fichier inattendu',
                    code: 'UNEXPECTED_FIELD',
                    message: err.message,
                });
                return;
            default:
                res.status(400).json({
                    error: 'Erreur upload',
                    code: 'UPLOAD_ERROR',
                    message: err.message,
                });
                return;
        }
    }
    
    if (err.message) {
        res.status(400).json({
            error: 'Erreur upload',
            code: 'UPLOAD_ERROR',
            message: err.message,
        });
        return;
    }
    
    next(err);
};

// ============================================
// EXPORT CONFIG
// ============================================

export const UPLOAD_CONFIG = {
    dir: UPLOAD_DIR,
    maxSize: MAX_FILE_SIZE,
    allowedTypes: ALL_ALLOWED_TYPES,
};

// ============================================
// LOG CONFIG
// ============================================

export const logUploadConfig = () => {
    console.log('║  📎 Uploads:                                              ║');
    console.log(`║  │  Directory:  ./uploads                                 ║`);
    console.log(`║  │  Max size:   ${MAX_FILE_SIZE / 1024 / 1024}MB                                      ║`);
    console.log('║  │  Types:      images, docs, archives                    ║');
};
