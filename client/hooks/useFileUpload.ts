import { useState, useCallback } from 'react';
import { 
    uploadTaskFiles, 
    uploadSubtaskFiles, 
    deleteAttachment,
    validateFiles,
    createPreviewUrl,
    revokePreviewUrl,
    isBlobUrl,
    UploadedAttachment 
} from '../services/uploadService';
import { Attachment } from '../types';

// ============================================
// TYPES
// ============================================

interface PendingFile {
    file: File;
    previewUrl: string;
    id: string; // ID temporaire pour le tracking
}

interface UseFileUploadOptions {
    onUploadComplete?: (attachments: UploadedAttachment[]) => void;
    onError?: (error: string) => void;
}

interface UseFileUploadReturn {
    // État
    pendingFiles: PendingFile[];
    isUploading: boolean;
    uploadProgress: number;
    error: string | null;
    
    // Actions
    addFiles: (files: FileList | File[]) => void;
    removeFile: (id: string) => void;
    removePendingFile: (id: string) => void;
    uploadToTask: (taskId: string) => Promise<UploadedAttachment[]>;
    uploadToSubtask: (subtaskId: string) => Promise<UploadedAttachment[]>;
    deleteExistingAttachment: (attachment: Attachment) => Promise<boolean>;
    clearPending: () => void;
    clearError: () => void;
}

// ============================================
// HOOK
// ============================================

export const useFileUpload = (options: UseFileUploadOptions = {}): UseFileUploadReturn => {
    const { onUploadComplete, onError } = options;
    
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Générer un ID temporaire unique
    const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Ajouter des fichiers à la liste d'attente
    const addFiles = useCallback((files: FileList | File[]) => {
        const fileArray = Array.from(files);
        
        // Valider les fichiers
        const validation = validateFiles(fileArray);
        if (!validation.valid) {
            const errorMsg = validation.errors.join(', ');
            setError(errorMsg);
            onError?.(errorMsg);
            return;
        }

        // Créer les entrées pending avec preview
        const newPending: PendingFile[] = fileArray.map(file => ({
            file,
            previewUrl: createPreviewUrl(file),
            id: generateTempId()
        }));

        setPendingFiles(prev => [...prev, ...newPending]);
        setError(null);
    }, [onError]);

    // Supprimer un fichier pending
    const removePendingFile = useCallback((id: string) => {
        setPendingFiles(prev => {
            const file = prev.find(f => f.id === id);
            if (file) {
                revokePreviewUrl(file.previewUrl);
            }
            return prev.filter(f => f.id !== id);
        });
    }, []);

    // Alias pour removeFile
    const removeFile = removePendingFile;

    // Upload vers une tâche
    const uploadToTask = useCallback(async (taskId: string): Promise<UploadedAttachment[]> => {
        if (pendingFiles.length === 0) return [];

        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            const files = pendingFiles.map(pf => pf.file);
            const uploaded = await uploadTaskFiles(taskId, files);
            
            // Nettoyer les preview URLs
            pendingFiles.forEach(pf => revokePreviewUrl(pf.previewUrl));
            setPendingFiles([]);
            setUploadProgress(100);
            
            onUploadComplete?.(uploaded);
            return uploaded;
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Erreur upload';
            setError(errorMsg);
            onError?.(errorMsg);
            throw err;
        } finally {
            setIsUploading(false);
        }
    }, [pendingFiles, onUploadComplete, onError]);

    // Upload vers une sous-tâche
    const uploadToSubtask = useCallback(async (subtaskId: string): Promise<UploadedAttachment[]> => {
        if (pendingFiles.length === 0) return [];

        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            const files = pendingFiles.map(pf => pf.file);
            const uploaded = await uploadSubtaskFiles(subtaskId, files);
            
            // Nettoyer les preview URLs
            pendingFiles.forEach(pf => revokePreviewUrl(pf.previewUrl));
            setPendingFiles([]);
            setUploadProgress(100);
            
            onUploadComplete?.(uploaded);
            return uploaded;
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Erreur upload';
            setError(errorMsg);
            onError?.(errorMsg);
            throw err;
        } finally {
            setIsUploading(false);
        }
    }, [pendingFiles, onUploadComplete, onError]);

    // Supprimer un attachment existant (déjà en base)
    const deleteExistingAttachment = useCallback(async (attachment: Attachment): Promise<boolean> => {
        // Si c'est une URL blob, c'est juste en local, pas besoin d'appeler l'API
        if (isBlobUrl(attachment.url)) {
            revokePreviewUrl(attachment.url);
            return true;
        }

        try {
            await deleteAttachment(attachment.id);
            return true;
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Erreur suppression';
            setError(errorMsg);
            onError?.(errorMsg);
            return false;
        }
    }, [onError]);

    // Nettoyer tous les fichiers pending
    const clearPending = useCallback(() => {
        pendingFiles.forEach(pf => revokePreviewUrl(pf.previewUrl));
        setPendingFiles([]);
    }, [pendingFiles]);

    // Effacer l'erreur
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        pendingFiles,
        isUploading,
        uploadProgress,
        error,
        addFiles,
        removeFile,
        removePendingFile,
        uploadToTask,
        uploadToSubtask,
        deleteExistingAttachment,
        clearPending,
        clearError
    };
};

export default useFileUpload;
