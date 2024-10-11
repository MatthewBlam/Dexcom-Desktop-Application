import { ComponentProps, forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import { useSettingsContext } from "../contexts/SettingsContext";
import { HTMLMotionProps, motion } from "framer-motion";
import { useHistoryContext } from "../contexts/HistoryContext";

interface Reading {
    id: string;
    value: number;
    mmol_l: number;
    trend: number;
    trend_direction: string;
    trend_description: string;
    trend_arrow: string;
    date_time: Array<string>;
}

export interface HistoryProps extends HTMLMotionProps<"div"> {
    open: boolean;
}

const variants = {
    hidden: { height: "auto" },
    visible: { height: 176 }, // Item height x 4, padding, padding, gap
};

export const History = forwardRef<HTMLDivElement, HistoryProps>(
    ({ children, className, open, ...props }, ref) => {
        const { unitSetting } = useSettingsContext();

        const { historyItems } = useHistoryContext();

        const historyElements = historyItems.map((d: Reading) => (
            <HistoryListItem
                key={String(d.date_time)}
                unit={unitSetting}
                value={unitSetting == "mg/dl" ? d.value : d.mmol_l}
                trendDescription={d.trend_description}
                trendArrow={d.trend_arrow}
                time={d.date_time[1]}
                date={d.date_time[0]}></HistoryListItem>
        ));
        return (
            <motion.div
                variants={variants}
                animate={open ? "visible" : "hidden"}
                transition={{
                    ease: "linear",
                    duration: 0.1,
                }}
                ref={ref}
                className={twMerge(
                    "flex flex-col content-center overflow-scroll px-8 py-0 mb-8 align-middle justify-start gap-2.5 rounded bg-transparent select-non",
                    className
                )}
                {...props}>
                {
                    historyElements[0]
                    /*
                !open
                    ? historyElements[0]
                    : [
                          historyElements,
                          historyElements,
                          historyElements,
                          historyElements,
                          historyElements,
                          historyElements,
                      ]
                          unused feature
                          */
                }
            </motion.div>
        );
    }
);

export interface HistoryListItemProps extends ComponentProps<"div"> {
    unit: string;
    value: number;
    trendDescription: string;
    trendArrow: string;
    time: string;
    date: string;
}

export const HistoryListItem = forwardRef<HTMLDivElement, HistoryListItemProps>(
    (
        {
            children,
            className,
            unit,
            value,
            trendDescription,
            trendArrow,
            time,
            date,
            ...props
        },
        ref
    ) => {
        const { sensorSetting } = useSettingsContext();
        const G7theme = sensorSetting === "G7" ? true : false;

        const { highSetting, lowSetting, highSettingMMOLL, lowSettingMMOLL } =
            useSettingsContext();

        const range = () => {
            console.log(unit);
            if (unit == "mg/dl") {
                if (value >= highSetting) {
                    console.log("yellow");
                    return "text-dex-yellow";
                }
                if (value <= lowSetting) {
                    return "text-dex-red";
                }
            } else {
                if (value >= highSettingMMOLL) {
                    return "text-dex-yellow";
                }
                if (value <= lowSettingMMOLL) {
                    return "text-dex-red";
                }
            }
            return "text-dex-green";
        };

        return (
            <div
                ref={ref}
                className={twMerge(
                    "flex justify-start px-4 py-3 gap-2.5 content-center align-middle rounded w-full select-none",
                    G7theme ? "bg-dex-bg" : "bg-dex-fg-light",
                    className
                )}
                {...props}>
                <div
                    id="icon"
                    className={twMerge("text-sm font-medium", range())}>
                    •
                </div>
                <div className="flex gap-1">
                    <div
                        id="number"
                        className="text-sm text-dex-text font-medium">
                        {value == -1 ? "--" : value}
                    </div>

                    <div
                        id="trend_arrow"
                        className="text-sm text-dex-text font-medium">
                        {value == -1 ? "" : trendArrow}
                    </div>
                    <div
                        id="trend_description"
                        className="text-sm text-dex-text font-medium ml-[1px]">
                        {value == -1 ? "" : trendDescription}
                    </div>
                </div>
                <div className="flex gap-2 ml-auto">
                    <div
                        id="time"
                        className="text-sm text-dex-text font-medium">
                        {value == -1 ? "" : time}
                        {value == -1 ? "" : ","}
                    </div>
                    <div
                        id="date"
                        className="text-sm text-dex-text font-medium">
                        {value == -1 ? "Unavailable" : date}
                    </div>
                </div>
            </div>
        );
    }
);
