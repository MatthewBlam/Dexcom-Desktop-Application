import { Reading, Settings, Trend } from "./types";

export interface FormattedReading {
    trend: Trend;
    mg_dl: string;
    mmol_l: string;
}

export function formatReading(reading: Reading): FormattedReading {
    let t = reading.trend_direction;
    if (t === "None" || t === "NotComputable" || t === "RateOutOfRange") {
        t = "Unavailable";
    }

    return {
        trend: t as Trend,
        mg_dl: reading.value === -1 ? "--" : String(reading.value),
        mmol_l: reading.mmol_l === -1 ? "--" : String(reading.mmol_l),
    };
}

export type ReadingRange = "normal" | "high" | "low";

export function getReadingRange(
    mg_dl: string,
    mmol_l: string,
    unit: Settings["unit"],
    thresholds: { high: number; low: number; highMMOLL: number; lowMMOLL: number },
): ReadingRange {
    if (unit === "mg/dl") {
        const val = Number(mg_dl);
        if (val <= thresholds.low) return "low";
        if (val >= thresholds.high) return "high";
    } else {
        const val = Number(mmol_l);
        if (val <= thresholds.lowMMOLL) return "low";
        if (val >= thresholds.highMMOLL) return "high";
    }
    return "normal";
}
