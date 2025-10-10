"use client";

import { useState, useCallback, memo } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import LoadingSpinner from "./LoadingSpinner";

interface ImageUploadProps {
    onImageUploaded: (url: string) => void;
}

function ImageUpload({ onImageUploaded }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);

    const compressImage = useCallback((file: File, quality = 0.8): Promise<Blob> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            const img = new Image();
            
            img.onload = () => {
                const maxWidth = 1200;
                const maxHeight = 1200;
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                }, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }, []);

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // Compress image before upload
            const compressedBlob = await compressImage(file);
            const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
            
            const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, compressedFile);
            const downloadURL = await getDownloadURL(storageRef);
            onImageUploaded(downloadURL);
            alert("Image uploadée avec succès!");
        } catch (error) {
            console.error("Erreur upload:", error);
            alert("Erreur lors de l'upload");
        } finally {
            setUploading(false);
        }
    }, [onImageUploaded, compressImage]);

    return (
        <div className="w-full">
            <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload}
                disabled={uploading}
                className="w-full p-2 sm:p-3 border rounded text-sm sm:text-base" 
                style={{borderColor: '#7D3837'}}
            />
            {uploading && <LoadingSpinner size="sm" text="Upload en cours..." />}
        </div>
    );
}

export default memo(ImageUpload);