import { useEffect, useRef } from 'react';

interface UseClickOutsideOptions {
    onOutsideClick: () => void;
    enabled?: boolean;
}

export const useClickOutside = ({ onOutsideClick, enabled = true }: UseClickOutsideOptions) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!enabled) return;

        const handleClick = (event: MouseEvent) => {
            const target = event.target as Node;
            if (ref.current && !ref.current.contains(target)) {
                onOutsideClick();
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [onOutsideClick, enabled]);

    return ref;
}; 