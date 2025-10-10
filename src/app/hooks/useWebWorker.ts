import { useRef, useCallback, useEffect } from 'react';

export function useWebWorker(workerPath: string) {
    const workerRef = useRef<Worker | null>(null);
    const callbacksRef = useRef<Map<string, (data: any) => void>>(new Map());

    useEffect(() => {
        if (typeof window !== 'undefined') {
            workerRef.current = new Worker(workerPath);
            
            workerRef.current.onmessage = (e) => {
                const { type, ...data } = e.data;
                const callback = callbacksRef.current.get(type);
                if (callback) {
                    callback(data);
                    callbacksRef.current.delete(type);
                }
            };
        }

        return () => {
            workerRef.current?.terminate();
        };
    }, [workerPath]);

    const postMessage = useCallback((type: string, data: any, callback?: (result: any) => void) => {
        if (workerRef.current && callback) {
            callbacksRef.current.set(`${type}_PROCESSED` || `${type}_CALCULATED` || `${type}_FILTERED`, callback);
        }
        workerRef.current?.postMessage({ type, data });
    }, []);

    return { postMessage };
}