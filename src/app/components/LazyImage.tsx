"use client";

import Image from "next/image";
import { useState } from "react";

interface LazyImageProps {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
}

export default function LazyImage({ src, alt, width, height, className }: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className={`relative ${className}`} style={{ width, height }}>
            {!isLoaded && (
                <div className="absolute inset-0 bg-slate-200 animate-pulse rounded" />
            )}
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
                onLoad={() => setIsLoaded(true)}
                loading="lazy"
            />
        </div>
    );
}