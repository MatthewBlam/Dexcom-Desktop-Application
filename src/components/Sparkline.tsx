import { useMemo } from "react";
import { Reading } from "../shared/types";
import { useSettingsContext } from "../contexts/SettingsContext";
import { getReadingRange } from "../shared/reading-utils";

interface SparklineProps {
    readings: Reading[];
    width?: number;
    height?: number;
}

export function Sparkline({ readings, width = 120, height = 30 }: SparklineProps) {
    const { settings } = useSettingsContext();

    const points = useMemo(() => {
        const valid = readings
            .slice(0, 12)
            .filter((r) => r.value !== -1)
            .reverse();
        if (valid.length < 2) return null;

        const values = valid.map((r) =>
            settings.unit === "mg/dl" ? r.value : r.mmol_l
        );
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        const padding = 3;
        const innerW = width - padding * 2;
        const innerH = height - padding * 2;

        return valid.map((r, i) => {
            const val = settings.unit === "mg/dl" ? r.value : r.mmol_l;
            const x = padding + (i / (valid.length - 1)) * innerW;
            const y = padding + innerH - ((val - min) / range) * innerH;
            const rangeResult = getReadingRange(
                String(r.value),
                String(r.mmol_l),
                settings.unit,
                { high: settings.high, low: settings.low, highMMOLL: settings.highMMOLL, lowMMOLL: settings.lowMMOLL }
            );
            return { x, y, range: rangeResult };
        });
    }, [readings, settings, width, height]);

    if (!points) return null;

    const colorMap = { high: "var(--color-dex-yellow)", low: "var(--color-dex-red)", normal: "var(--color-dex-green)" };

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="select-none">
            {points.map((p, i) => (
                <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={2.5}
                    fill={colorMap[p.range] ?? colorMap.normal}
                />
            ))}
        </svg>
    );
}
