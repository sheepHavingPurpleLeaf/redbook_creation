export interface ContentData {
    title: string;
    content: string;
    tags: string[];
    images: string[];
    briefData?: Record<string, string>;
    keyContents?: Record<string, string[]>;
}

export interface UploadFormProps {
    onGenerateStart: () => void;
    onGenerateComplete: (content: ContentData) => void;
    onError: (error: string) => void;
}

export interface ContentPreviewProps {
    content: ContentData;
}

export interface ImageUploadProps {
    onImagesSelected: (files: File[]) => void;
    selectedFiles: File[];
}

export interface BriefFileUploadProps {
    onFileSelected: (file: File) => void;
    selectedFile: File | null;
} 