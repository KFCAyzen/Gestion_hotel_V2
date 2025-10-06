"use client";

import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

interface ImageUploadProps {
    onImageUploaded: (url: string) => void;
}

export default function ImageUpload({ onImageUploaded }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            onImageUploaded(downloadURL);
            alert("Image uploadée avec succès!");
        } catch (error) {
            console.error("Erreur upload:", error);
            alert("Erreur lors de l'upload");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload}
                disabled={uploading}
                className="p-2 border rounded" 
                style={{borderColor: '#7D3837'}}
            />
            {uploading && <p style={{color: '#7D3837'}}>Upload en cours...</p>}
        </div>
    );
}