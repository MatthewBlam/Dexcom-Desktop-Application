import { useMemo } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    ReferenceLine,
    ReferenceArea,
    Dot,
} from "recharts";
import { Reading, Settings } from "../shared/types";
import { parseReadingDateTime } from "../shared/reading-utils";

interface GlucoseGraphProps {
    readings: Reading[];
    settings: Settings;
    timeRange: number;
    graphHeight: number;
}

interface DataPoint {
    time: number;
    value: number;
    range: "normal" | "high" | "low";
}

function CustomDot(props: any) {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null) return null;
    const color =
        payload.range === "high"
            ? "var(--color-dex-yellow)"
            : payload.range === "low"
              ? "var(--color-dex-red)"
              : "var(--color-dex-green)";
    return <Dot cx={cx} cy={cy} r={2.5} fill={color} stroke="none" />;
}

export function GlucoseGraph({ readings, settings, timeRange, graphHeight }: GlucoseGraphProps) {
    const now = Date.now();
    const cutoff = now - timeRange * 60 * 1000;

    const data = useMemo<DataPoint[]>(() => {
        const isMgDl = settings.unit === "mg/dl";
        const high = isMgDl ? settings.high : settings.highMMOLL;
        const low = isMgDl ? settings.low : settings.lowMMOLL;

        return readings
            .filter((r) => r.value !== -1)
            .map((r) => {
                const date = parseReadingDateTime(r.date_time as [string, string]);
                if (!date) return null;
                const time = date.getTime();
                if (time < cutoff) return null;
                const value = isMgDl ? r.value : r.mmol_l;
                const range = value >= high ? "high" : value <= low ? "low" : "normal";
                return { time, value, range } as DataPoint;
            })
            .filter(Boolean)
            .sort((a, b) => a!.time - b!.time) as DataPoint[];
    }, [readings, settings, cutoff]);

    const isMgDl = settings.unit === "mg/dl";
    const high = isMgDl ? settings.high : settings.highMMOLL;
    const low = isMgDl ? settings.low : settings.lowMMOLL;
    const criticalLow = isMgDl ? settings.criticalLow : settings.criticalLowMMOLL;

    const yMin = isMgDl ? 40 : 2.0;
    const yMax = isMgDl ? graphHeight : Math.round((graphHeight / 18.018) * 10) / 10;

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-sm text-dex-text-muted select-none">
                No readings in this time range
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%" className="-ml-3">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
                <XAxis
                    dataKey="time"
                    type="number"
                    domain={[cutoff, now]}
                    tickFormatter={(ts) => new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    tick={{ fontSize: 10, fill: "var(--color-dex-text-muted)" }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-dex-fg)" }}
                    minTickGap={40}
                />
                <YAxis
                    domain={[yMin, yMax]}
                    ticks={[criticalLow, low, high, yMax]}
                    tick={{ fontSize: 10, fill: "var(--color-dex-text-muted)" }}
                    tickLine={false}
                    axisLine={false}
                />
                <ReferenceArea y1={low} y2={high} fill="var(--color-dex-green)" fillOpacity={0.06} />
                <ReferenceArea y1={high} y2={yMax} fill="var(--color-dex-yellow)" fillOpacity={0.06} />
                <ReferenceArea y1={criticalLow} y2={low} fill="var(--color-dex-red)" fillOpacity={0.04} />
                <ReferenceArea y1={yMin} y2={criticalLow} fill="var(--color-dex-red)" fillOpacity={0.08} />
                <ReferenceLine y={high} stroke="var(--color-dex-yellow)" strokeDasharray="4 4" strokeWidth={1} />
                <ReferenceLine y={low} stroke="var(--color-dex-red)" strokeDasharray="4 4" strokeWidth={1} />
                <ReferenceLine y={criticalLow} stroke="var(--color-dex-red)" strokeWidth={1.5} />
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke="none"
                    dot={<CustomDot />}
                    activeDot={false}
                    isAnimationActive={false}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
