import React, { useRef, useCallback } from 'react';
import { Upload, X, File, Image, FileText, Archive, Loader2, AlertCircle } from 'lucide-react';
import { formatFileSize, getFileTypeFromName, isBlobUrl } from '../services/uploadService';
import { Attachment } from '../types';

// ============================================
// TYPES
// ============================================

interface PendingFile {
    file: File;
    previewUrl: string;
    id: string;
}

interface FileUploadProps {
    // Fichiers existants (déjà en base)
    existingAttachments?: Attachment[];
    // Fichiers en attente d'upload
    pendingFiles?: PendingFile[];
    // Callbacks
    onFilesSelected: (files: FileList) => void;
    onRemoveExisting?: (attachment: Attachment) => void;
    onRemovePending?: (id: string) => void;
    // État
    isUploading?: boolean;
    error?: string | null;
    // Options
    disabled?: boolean;
    maxFiles?: number;
    accept?: string;
    label?: string;
}

// ============================================
// HELPER: Icône selon le type de fichier
// ============================================

const FileIcon: React.FC<{ type: string; className?: string }> = ({ type, className = "w-5 h-5" }) => {
    switch (type) {
        case 'image':
            return <Image className={`${className} text-blue-500`} />;
        case 'document':
            return <FileText className={`${className} text-orange-500`} />;
        case 'archive':
            return <Archive className={`${className} text-purple-500`} />;
        default:
            return <File className={`${className} text-inksoft`} />;
    }
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

const FileUpload: React.FC<FileUploadProps> = ({
    existingAttachments = [],
    pendingFiles = [],
    onFilesSelected,
    onRemoveExisting,
    onRemovePending,
    isUploading = false,
    error = null,
    disabled = false,
    maxFiles = 5,
    accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z",
    label = "Pièces jointes"
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = useCallback(() => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [disabled]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(e.target.files);
            // Reset input pour permettre de sélectionner le même fichier
            e.target.value = '';
        }
    }, [onFilesSelected]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!disabled && e.dataTransfer.files.length > 0) {
            onFilesSelected(e.dataTransfer.files);
        }
    }, [disabled, onFilesSelected]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const totalFiles = existingAttachments.length + pendingFiles.length;
    const canAddMore = totalFiles < maxFiles;

    return (
        <div className="space-y-3">
            {/* Label */}
            <label className="block text-sm font-medium text-inkmuted">
                {label} ({totalFiles}/{maxFiles})
            </label>

            {/* Zone de drop */}
            {canAddMore && (
                <div
                    onClick={handleClick}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className={`
                        border-2 border-dashed rounded-xl p-4 text-center cursor-pointer
                        transition-all duration-200
                        ${disabled 
                            ? 'border-line bg-surface2 cursor-not-allowed' 
                            : 'border-line hover:border-indigo-500 hover:bg-surface2'
                        }
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={accept}
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={disabled}
                    />
                    
                    {isUploading ? (
                        <div className="flex flex-col items-center gap-2 text-inkmuted">
                            <Loader2 className="w-8 h-8 animate-spin text-brand" />
                            <span>Upload en cours...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-inkmuted">
                            <Upload className="w-8 h-8" />
                            <span className="text-sm">
                                Cliquez ou glissez des fichiers ici
                            </span>
                            <span className="text-xs text-inksoft">
                                Max {maxFiles} fichiers, 10MB chacun
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Message d'erreur */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Liste des fichiers */}
            {(existingAttachments.length > 0 || pendingFiles.length > 0) && (
                <div className="space-y-2">
                    {/* Fichiers existants (déjà uploadés) */}
                    {existingAttachments.map((att) => (
                        <div
                            key={att.id}
                            className="flex items-center gap-3 p-3 bg-surface2 rounded-lg group"
                        >
                            {/* Preview image ou icône */}
                            {att.type === 'image' ? (
                                <img
                                    src={att.url}
                                    alt={att.name}
                                    className="w-10 h-10 object-cover rounded"
                                />
                            ) : (
                                <div className="w-10 h-10 flex items-center justify-center bg-surface2 rounded">
                                    <FileIcon type={att.type} />
                                </div>
                            )}

                            {/* Infos */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-inksoft truncate">{att.name}</p>
                                <p className="text-xs text-inksoft">
                                    {formatFileSize(att.size)}
                                    {isBlobUrl(att.url) && (
                                        <span className="ml-2 text-amber-500">(non sauvegardé)</span>
                                    )}
                                </p>
                            </div>

                            {/* Bouton supprimer */}
                            {onRemoveExisting && (
                                <button
                                    onClick={() => onRemoveExisting(att)}
                                    className="p-1 text-inksoft hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Supprimer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Fichiers en attente (pas encore uploadés) */}
                    {pendingFiles.map((pf) => (
                        <div
                            key={pf.id}
                            className="flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg group"
                        >
                            {/* Preview image ou icône */}
                            {pf.file.type.startsWith('image/') ? (
                                <img
                                    src={pf.previewUrl}
                                    alt={pf.file.name}
                                    className="w-10 h-10 object-cover rounded"
                                />
                            ) : (
                                <div className="w-10 h-10 flex items-center justify-center bg-surface2 rounded">
                                    <FileIcon type={getFileTypeFromName(pf.file.name)} />
                                </div>
                            )}

                            {/* Infos */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-inksoft truncate">{pf.file.name}</p>
                                <p className="text-xs text-indigo-400">
                                    {formatFileSize(pf.file.size)} • En attente d'upload
                                </p>
                            </div>

                            {/* Bouton supprimer */}
                            {onRemovePending && (
                                <button
                                    onClick={() => onRemovePending(pf.id)}
                                    className="p-1 text-inksoft hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Retirer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileUpload;
