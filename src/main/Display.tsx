import { ComponentProps, forwardRef, MouseEventHandler } from "react";
import { twMerge } from "tailwind-merge";
import { Button } from "../components/Button";
import { DexcomG6, DexcomG7 } from "../components/Dexcom";
import { useSettingsContext } from "../contexts/SettingsContext";
import {
    CloseWidgetIcon,
    OpenWidgetIcon,
    SettingsIcon,
} from "../components/Icons";
import { History } from "../components/History";

type Trend =
    | "Unavailable"
    | "DoubleUp"
    | "SingleUp"
    | "FortyFiveUp"
    | "Flat"
    | "FortyFiveDown"
    | "SingleDown"
    | "DoubleDown";

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

export interface DisplayProps extends ComponentProps<"div"> {
    reading: Reading;
    openSettings: MouseEventHandler;
    toggleWidget: MouseEventHandler;
    widgetOpen: boolean;
    tabbable: boolean;
}

export const Display = forwardRef<HTMLDivElement, DisplayProps>(
    (
        {
            reading,
            openSettings,
            toggleWidget,
            widgetOpen,
            tabbable,
            children,
            className,
            ...props
        },
        ref
    ) => {
        const { sensorSetting } = useSettingsContext();
        const G7theme = sensorSetting === "G7" ? true : false;

        let t = reading.trend_direction;
        if (t == "None" || t == "NotComputable" || t == "RateOutOfRange") {
            t = "Unavailable";
        }
        let v;
        if (reading.value == -1) {
            v = "--";
        } else {
            v = reading.value;
        }
        let m;
        if (reading.mmol_l == -1) {
            m = "--";
        } else {
            m = reading.mmol_l;
        }
        const trend: Trend = t as Trend;
        const mg_dl = v;
        const mmol_l = m;

        return (
            <div
                ref={ref}
                className={twMerge(
                    "flex flex-col w-full h-full px-8 pb-[40px] pt-[20px]",
                    className
                )}
                {...props}>
                <div className="flex flex-col w-full flex-1">
                    <div className="w-full flex flex-row gap-4">
                        <Button
                            className={
                                G7theme
                                    ? "bg-dex-bg hover:bg-dex-fg-light"
                                    : "bg-dex-fg-light hover:bg-dex-fg"
                            }
                            Icon={() => {
                                return <SettingsIcon solid={false} />;
                            }}
                            tabbable={tabbable}
                            click={openSettings}
                            text="Settings"></Button>

                        <Button
                            className={twMerge(
                                "ml-auto",
                                G7theme
                                    ? "bg-dex-bg hover:bg-dex-fg-light"
                                    : "bg-dex-fg-light hover:bg-dex-fg"
                            )}
                            Icon={() => {
                                if (widgetOpen) {
                                    return <CloseWidgetIcon solid={false} />;
                                }
                                return <OpenWidgetIcon solid={false} />;
                            }}
                            tabbable={tabbable}
                            click={toggleWidget}
                            text={
                                widgetOpen ? "Close Widget" : "Open Widget"
                            }></Button>
                    </div>
                    <div className="w-full h-full mb-3">
                        {G7theme ? (
                            <DexcomG7
                                trend={trend}
                                mg_dl={String(mg_dl)}
                                mmol_l={String(mmol_l)}></DexcomG7>
                        ) : (
                            <DexcomG6
                                trend={trend}
                                mg_dl={String(mg_dl)}
                                mmol_l={String(mmol_l)}></DexcomG6>
                        )}
                    </div>
                </div>
                <History
                    open={false}
                    className="w-[calc(100%+64px)] -ml-8"></History>
            </div>
        );
    }
);
