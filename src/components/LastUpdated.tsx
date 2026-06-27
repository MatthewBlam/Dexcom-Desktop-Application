import { useState, useEffect } from "react";
import { getRelativeTime } from "../shared/reading-utils";

interface LastUpdatedProps {
    dateTime: [string, string];
}

export function LastUpdated({ dateTime }: LastUpdatedProps) {
    const [relative, setRelative] = useState(() => getRelativeTime(dateTime));

    useEffect(() => {
        setRelative(getRelativeTime(dateTime));
        const id = setInterval(() => setRelative(getRelativeTime(dateTime)), 10_000);
        return () => clearInterval(id);
    }, [dateTime[0], dateTime[1]]);

    if (!relative) return null;

    return (
        <span className="text-xs text-dex-text-muted">
            Updated {relative}
        </span>
    );
}
