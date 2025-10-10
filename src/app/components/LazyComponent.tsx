import { useState, useEffect, useRef, ReactNode } from 'react';

interface LazyComponentProps {
    children: ReactNode;
    fallback?: ReactNode;
    rootMargin?: string;
    threshold?: number;
}

export default function LazyComponent({ 
    children, 
    fallback = <div className="h-32 bg-gray-100 animate-pulse rounded" />,
    rootMargin = '50px',
    threshold = 0.1
}: LazyComponentProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin, threshold }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [rootMargin, threshold]);

    return (
        <div ref={ref}>
            {isVisible ? children : fallback}
        </div>
    );
}