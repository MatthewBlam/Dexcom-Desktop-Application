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

export function parseReadingDateTime(dateTime: [string, string]): Date | null {
    const [datePart, timePart] = dateTime;
    if (datePart === "Unavailable" || timePart === "Unavailable") return null;
    const [yy, mm, dd] = datePart.split("/").map(Number);
    const year = 2000 + yy;
    const match = timePart.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3].toLowerCase();
    if (ampm === "pm" && hours !== 12) hours += 12;
    if (ampm === "am" && hours === 12) hours = 0;
    return new Date(year, mm - 1, dd, hours, minutes);
}

export function getRelativeTime(dateTime: [string, string]): string {
    const date = parseReadingDateTime(dateTime);
    if (!date) return "";
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 30) return "just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
}

export interface RateOfChange {
    value: number;
    formatted: string;
    severity: "stable" | "moderate" | "rapid";
}

export function calculateRateOfChange(
    readings: Reading[],
    unit: Settings["unit"]
): RateOfChange | null {
    if (readings.length < 2) return null;

    const newest = readings[0];
    const previous = readings[1];

    if (newest.value === -1 || previous.value === -1) return null;

    const newestDate = parseReadingDateTime(newest.date_time);
    const previousDate = parseReadingDateTime(previous.date_time);
    if (!newestDate || !previousDate) return null;

    const deltaMinutes = (newestDate.getTime() - previousDate.getTime()) / 60000;
    if (deltaMinutes <= 0 || deltaMinutes > 15) return null;

    const deltaValue =
        unit === "mg/dl"
            ? newest.value - previous.value
            : newest.mmol_l - previous.mmol_l;

    const rate = deltaValue / deltaMinutes;

    const absRate = Math.abs(rate);
    const stableThreshold = unit === "mg/dl" ? 1 : 1 / 18;
    const moderateThreshold = unit === "mg/dl" ? 2 : 2 / 18;

    const severity: RateOfChange["severity"] =
        absRate < stableThreshold
            ? "stable"
            : absRate <= moderateThreshold
              ? "moderate"
              : "rapid";

    const sign = rate > 0 ? "+" : "";
    const formatted = `${sign}${rate.toFixed(1)}`;

    return { value: rate, formatted, severity };
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
