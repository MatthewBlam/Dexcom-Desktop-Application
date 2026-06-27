import { ComponentProps, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import { useSettingsContext } from "../contexts/SettingsContext";
import { AnimatePresence, motion } from "motion/react";
import { useHistoryContext } from "../contexts/HistoryContext";
import { Reading, DEFAULT_SETTINGS } from "../shared/types";
import { getReadingRange } from "../shared/reading-utils";
import { GlucoseGraph } from "./GlucoseGraph";
import { RateOfChange } from "./RateOfChange";
import { LastUpdated } from "./LastUpdated";
import { ConnectionIndicator } from "./ConnectionIndicator";
import { Slider } from "./Slider";
import { X } from "lucide-react";
import { ConnectionStatus } from "../shared/types";

export interface HistoryProps {
  open: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  connectionStatus: ConnectionStatus;
  className?: string;
}

const TIME_RANGES = [
  { label: "1h", minutes: 60 },
  { label: "3h", minutes: 180 },
  { label: "6h", minutes: 360 },
  { label: "12h", minutes: 720 },
  { label: "24h", minutes: 1440 },
] as const;

export const History = forwardRef<HTMLDivElement, HistoryProps>(({ className, open, expanded, onToggleExpanded, connectionStatus, ...props }, ref) => {
  const { sensorSetting, unitSetting, highSetting, lowSetting, highSettingMMOLL, lowSettingMMOLL, criticalLowSetting, criticalLowSettingMMOLL } = useSettingsContext();
  const { historyItems } = useHistoryContext();
  const [timeRange, setTimeRange] = useState(180);
  const [graphHeight, setGraphHeight] = useState(300);
  const [splitPercent, setSplitPercent] = useState(75);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onHandlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = true;
  }, []);

  const onHandlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const pct = (y / rect.height) * 100;
    setSplitPercent(Math.min(90, Math.max(20, pct)));
  }, []);

  const onHandlePointerUp = useCallback(() => {
    dragging.current = false;
    window.api.saveHistorySplit(splitPercent).catch(() => {});
  }, [splitPercent]);

  useEffect(() => {
    window.api
      .getHistorySplit()
      .then(setSplitPercent)
      .catch(() => {});
    window.api
      .getHistoryTimeRange()
      .then(setTimeRange)
      .catch(() => {});
    window.api
      .getHistoryGraphHeight()
      .then(setGraphHeight)
      .catch(() => {});
  }, []);

  const latestReading = historyItems.find((r) => r.value !== -1) ?? null;

  const latestValue = latestReading && latestReading.value !== -1 ? (unitSetting === "mg/dl" ? latestReading.value : latestReading.mmol_l) : null;

  const settings = {
    ...DEFAULT_SETTINGS,
    sensor: sensorSetting,
    unit: unitSetting,
    high: highSetting,
    low: lowSetting,
    highMMOLL: highSettingMMOLL,
    lowMMOLL: lowSettingMMOLL,
    criticalLow: criticalLowSetting,
    criticalLowMMOLL: criticalLowSettingMMOLL,
  };

  if (!open) return null;

  return (
    <>
      {/* Collapsed bottom bar */}
      <AnimatePresence>
        {!expanded && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onToggleExpanded}
            className={twMerge("flex items-center px-4 py-3 gap-2.5 rounded cursor-pointer select-none", "bg-dex-bg hover:bg-dex-fg-light", className)}>
            {latestValue !== null && (
              <>
                <span className="text-sm text-dex-text font-medium">{latestValue}</span>
                <span className="text-sm text-dex-text font-medium">{latestReading!.trend_arrow !== "Unavailable" && latestReading!.trend_arrow}</span>
                <RateOfChange />
              </>
            )}
            {latestValue === null && <span className="text-sm text-dex-text-muted">No readings</span>}
            <div className="flex-1" />
            {latestReading && latestReading.value !== -1 && (
              <div className="flex items-center gap-2.5">
                <ConnectionIndicator status={connectionStatus} />
                <LastUpdated dateTime={latestReading.date_time as [string, string]} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded modal */}
      {createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={expanded ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={twMerge(
            "fixed p-6 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[90%] max-w-[80vw] h-[80vh] rounded-xl drop-shadow-2xl flex flex-col gap-2 overflow-hidden",
            "bg-dex-bg",
            clsx({ "pointer-events-none": !expanded }),
          )}>
          <div className="flex gap-1">
            {TIME_RANGES.map((tr) => (
              <button
                key={tr.label}
                onClick={() => {
                  setTimeRange(tr.minutes);
                  window.api.saveHistoryTimeRange(tr.minutes).catch(() => {});
                }}
                className={twMerge(
                  "cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg select-none transition-colors",
                  timeRange === tr.minutes
                    ? "bg-dex-green text-white"
                    : "bg-dex-fg-light text-dex-text-muted hover:text-dex-text",
                )}>
                {tr.label}
              </button>
            ))}
            <div className="flex items-center ml-2">
              <Slider
                min={200}
                max={400}
                step={10}
                value={graphHeight}
                onChange={(v) => {
                  setGraphHeight(v);
                  window.api.saveHistoryGraphHeight(v).catch(() => {});
                }}
                formatLabel={(v) => String(v)}
              />
            </div>
            <button onClick={onToggleExpanded} className="cursor-pointer appearance-none ml-auto relative inline-flex items-center justify-center size-6 rounded bg-transparent">
              <X className="size-5 absolute text-dex-text-muted hover:text-dex-text transition-all duration-[0.03s]" strokeWidth={2.15} />
            </button>
          </div>
          <div ref={containerRef} className="flex-1 min-h-0 flex flex-col" onPointerMove={onHandlePointerMove} onPointerUp={onHandlePointerUp}>
            <div className="relative min-h-30 overflow-hidden [&_*:focus]:outline-none" style={{ height: `${splitPercent}%` }}>
              <div className="absolute inset-0">
                <GlucoseGraph readings={historyItems} settings={settings} timeRange={timeRange} graphHeight={graphHeight} />
              </div>
            </div>
            <div onPointerDown={onHandlePointerDown} className="shrink-0 flex items-center justify-center h-3 cursor-row-resize select-none">
              <div className="w-12 h-1 rounded-full bg-dex-text-muted/50 hover:bg-dex-text-muted transition-colors duration-200" />
            </div>
            <div className="flex-1 min-h-11 overflow-y-auto flex flex-col rounded gap-2">
              {historyItems
                .filter((r) => r.value !== -1)
                .slice(0, 50)
                .map((d: Reading) => (
                  <HistoryListItem
                    key={String(d.date_time)}
                    unit={unitSetting}
                    value={unitSetting === "mg/dl" ? d.value : d.mmol_l}
                    mgDl={d.value}
                    mmolL={d.mmol_l}
                    trendDescription={d.trend_description}
                    trendArrow={d.trend_arrow}
                    time={d.date_time[1]}
                    date={d.date_time[0]}
                  />
                ))}
            </div>
          </div>
        </motion.div>,
        document.body,
      )}
    </>
  );
});

export interface HistoryListItemProps extends ComponentProps<"div"> {
  unit: string;
  value: number;
  mgDl: number;
  mmolL: number;
  trendDescription: string;
  trendArrow: string;
  time: string;
  date: string;
}

export const HistoryListItem = forwardRef<HTMLDivElement, HistoryListItemProps>(({ children, className, unit, value, mgDl, mmolL, trendDescription, trendArrow, time, date, ...props }, ref) => {
  const { highSetting, lowSetting, highSettingMMOLL, lowSettingMMOLL } = useSettingsContext();

  const rangeResult = getReadingRange(String(mgDl), String(mmolL), unit as "mg/dl" | "mmol/l", { high: highSetting, low: lowSetting, highMMOLL: highSettingMMOLL, lowMMOLL: lowSettingMMOLL });
  const rangeColor = rangeResult === "high" ? "text-dex-yellow" : rangeResult === "low" ? "text-dex-red" : "text-dex-green";

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formattedDate = useMemo(() => {
    const parts = date.split("/");
    if (parts.length !== 3) return date;
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (isNaN(month) || isNaN(day)) return date;
    return `${MONTHS[month - 1]} ${day}`;
  }, [date]);

  return (
    <div ref={ref} className={twMerge("flex justify-start px-4 py-3 gap-2.5 content-center align-middle rounded w-full select-none", "bg-dex-fg-light", className)} {...props}>
      <div className={twMerge("text-sm font-medium", rangeColor)}>•</div>
      <div className="flex gap-1">
        <div className="text-sm text-dex-text font-medium">{value === -1 ? "--" : value}</div>

        <div className="text-sm text-dex-text font-medium">{value === -1 ? "" : trendArrow}</div>
        <div className="text-sm text-dex-text font-medium ml-[1px]">{value === -1 ? "" : trendDescription}</div>
      </div>
      <div className="flex gap-2 ml-auto">
        <div className="text-sm text-dex-text font-medium">
          {value === -1 ? "" : time}
          {value === -1 ? "" : ","}
        </div>
        <div className="text-sm text-dex-text font-medium">{value === -1 ? "Unavailable" : formattedDate}</div>
      </div>
    </div>
  );
});
