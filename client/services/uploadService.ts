import api from './api';

// ============================================
// TYPES
// ============================================

export interface UploadedAttachment {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    taskId?: string;
    subtaskId?: string;
    createdAt: string;
}

export interface UploadResponse {
    success: boolean;
    attachments: UploadedAttachment[];
}

// ============================================
// UPLOAD SERVICE
// ============================================

/**
 * Upload des fichiers pour une tâche
 */
export const uploadTaskFiles = async (taskId: string, files: File[]): Promise<UploadedAttachment[]> => {
    if (!files || files.length === 0) {
        return [];
    }

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
        const response = await api.post<UploadResponse>(`/attachments/task/${taskId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        console.log(`📎 ${response.data.attachments.length} fichiers uploadés pour tâche ${taskId}`);
        return response.data.attachments;
    } catch (error) {
        console.error('❌ Erreur upload fichiers tâche:', error);
        throw error;
    }
};

/**
 * Upload des fichiers pour une sous-tâche
 */
export const uploadSubtaskFiles = async (subtaskId: string, files: File[]): Promise<UploadedAttachment[]> => {
    if (!files || files.length === 0) {
        return [];
    }

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
        const response = await api.post<UploadResponse>(`/attachments/subtask/${subtaskId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        console.log(`📎 ${response.data.attachments.length} fichiers uploadés pour sous-tâche ${subtaskId}`);
        return response.data.attachments;
    } catch (error) {
        console.error('❌ Erreur upload fichiers sous-tâche:', error);
        throw error;
    }
};

/**
 * Supprimer un attachment
 */
export const deleteAttachment = async (attachmentId: string): Promise<boolean> => {
    try {
        await api.delete(`/attachments/${attachmentId}`);
        console.log(`🗑️ Attachment supprimé: ${attachmentId}`);
        return true;
    } catch (error) {
        console.error('❌ Erreur suppression attachment:', error);
        throw error;
    }
};

/**
 * Convertir un File en preview URL (pour affichage avant upload)
 */
export const createPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file);
};

/**
 * Libérer une preview URL
 */
export const revokePreviewUrl = (url: string): void => {
    if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
};

/**
 * Vérifier si une URL est une URL blob (non persistée)
 */
export const isBlobUrl = (url: string): boolean => {
    return url.startsWith('blob:');
};

/**
 * Obtenir le type de fichier depuis le nom
 */
export const getFileTypeFromName = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];
    const archiveExts = ['zip', 'rar', '7z'];
    
    if (imageExts.includes(ext)) return 'image';
    if (docExts.includes(ext)) return 'document';
    if (archiveExts.includes(ext)) return 'archive';
    return 'other';
};

/**
 * Formater la taille d'un fichier
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Valider un fichier avant upload
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
    ];
    
    if (file.size > maxSize) {
        return { valid: false, error: `Le fichier ${file.name} dépasse 10MB` };
    }
    
    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: `Type de fichier non autorisé: ${file.type}` };
    }
    
    return { valid: true };
};

/**
 * Valider plusieurs fichiers
 */
export const validateFiles = (files: File[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (files.length > 5) {
        errors.push('Maximum 5 fichiers à la fois');
    }
    
    files.forEach(file => {
        const result = validateFile(file);
        if (!result.valid && result.error) {
            errors.push(result.error);
        }
    });
    
    return { valid: errors.length === 0, errors };
};

export default {
    uploadTaskFiles,
    uploadSubtaskFiles,
    deleteAttachment,
    createPreviewUrl,
    revokePreviewUrl,
    isBlobUrl,
    getFileTypeFromName,
    formatFileSize,
    validateFile,
    validateFiles
};
