import { useEffect, useRef, useState } from "react";

export function useAnimatedValue(target: number, durationMs = 500): number {
    const [display, setDisplay] = useState(target);
    const rafRef = useRef<number>(0);
    const startRef = useRef({ value: target, time: 0 });

    useEffect(() => {
        if (target === -1) {
            setDisplay(-1);
            return;
        }

        const from = display === -1 ? target : display;
        startRef.current = { value: from, time: performance.now() };

        const animate = (now: number) => {
            const elapsed = now - startRef.current.time;
            const progress = Math.min(elapsed / durationMs, 1);
            const eased = 1 - (1 - progress) ** 3;
            const current = from + (target - from) * eased;
            setDisplay(current);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafRef.current);
    }, [target, durationMs]);

    return display;
}
