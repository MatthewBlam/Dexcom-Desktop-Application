import { ComponentProps, forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import { useSettingsContext } from "../contexts/SettingsContext";

type Trend =
    | "Unavailable"
    | "DoubleUp"
    | "SingleUp"
    | "FortyFiveUp"
    | "Flat"
    | "FortyFiveDown"
    | "SingleDown"
    | "DoubleDown";

export interface DexcomProps extends ComponentProps<"div"> {
    trend: Trend;
    mg_dl: string;
    mmol_l: string;
}

const trendletiantsG6 = (letiant: Trend) => {
    const letiants = {
        Unavailable: {
            rotate: "rotate-[0deg]",
            arrow: "translate(21px, -21px)",
            hidden: true,
        },
        DoubleUp: {
            rotate: "rotate-[-45deg]",
            arrow: "translate(0px, 0px)",
            hidden: false,
        },
        SingleUp: {
            rotate: "rotate-[-45deg]",
            arrow: "translate(21px, -21px)",
            hidden: false,
        },
        FortyFiveUp: {
            rotate: "rotate-[0deg]",
            arrow: "translate(21px, -21px)",
            hidden: false,
        },
        Flat: {
            rotate: "rotate-[45deg]",
            arrow: "translate(21px, -21px)",
            hidden: false,
        },
        FortyFiveDown: {
            rotate: "rotate-[90deg]",
            arrow: "translate(21px, -21px)",
            hidden: false,
        },
        SingleDown: {
            rotate: "rotate-[135deg]",
            arrow: "translate(21px, -21px)",
            hidden: false,
        },
        DoubleDown: {
            rotate: "rotate-[135deg]",
            arrow: "translate(0px, 0px)",
            hidden: false,
        },
    };
    return letiants[letiant];
};

export const DexcomG6 = forwardRef<HTMLDivElement, DexcomProps>(
    ({ trend, mg_dl, mmol_l, children, className, ...props }, ref) => {
        const {
            unitSetting,
            highSetting,
            lowSetting,
            highSettingMMOLL,
            lowSettingMMOLL,
        } = useSettingsContext();

        const high = mg_dl >= highSetting ? true : false;
        const low = mg_dl <= lowSetting ? true : false;
        const highMMOLL = mmol_l >= highSettingMMOLL ? true : false;
        const lowMMOLL = mmol_l <= lowSettingMMOLL ? true : false;

        let circleColor = "#DCDCDC";
        if (unitSetting == "mg/dl") {
            if (high) {
                circleColor = "#ffcc3d";
            }
            if (low) {
                circleColor = "#f73d45";
            }
        } else {
            if (highMMOLL) {
                circleColor = "#ffcc3d";
            }
            if (lowMMOLL) {
                circleColor = "#f73d45";
            }
        }
        let textColor = "text-[#373737]";
        if (unitSetting == "mg/dl") {
            if (low) {
                textColor = "text-[#ffffff]";
            }
        } else {
            if (lowMMOLL) {
                textColor = "text-[#ffffff]";
            }
        }

        const letiant = trendletiantsG6(trend);
        return (
            <div
                ref={ref}
                className={twMerge("flex w-full h-full", className)}
                {...props}>
                <div
                    id="dexcom"
                    className="relative scale-dscale w-full h-full -mt-[1%]">
                    <div
                        id="dexcom_body"
                        className={twMerge(
                            letiant.rotate,
                            "absolute origin-center left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                        )}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="250"
                            height="250"
                            viewBox="0 0 250 250">
                            <path
                                id="dexcom_back"
                                d="m124.99987,0h120.00013c2.76143,0,5,2.23858,5,5v120.00012c0,69.03552-55.96436,124.99988-124.99988,124.99988h-.00025C55.96435,250,0,194.03564,0,125.00013v-.00025C0,55.96436,55.96435,0,124.99987,0h0Z"
                                style={{
                                    fill: "#969596",
                                    opacity: letiant.hidden ? "0" : "1",
                                }}
                            />
                            <svg
                                id="circle-NODATA"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 250 250">
                                <circle
                                    cx="125"
                                    cy="125"
                                    r="125"
                                    style={{
                                        fill: "#969596",
                                        opacity: letiant.hidden ? "1" : "0",
                                    }}
                                />
                            </svg>
                            <circle
                                id="dexcom_circle"
                                cx="125"
                                cy="125"
                                r="105"
                                style={{
                                    fill: circleColor,
                                    stroke: "white",
                                    strokeMiterlimit: 10,
                                    strokeWidth: "4px",
                                }}
                            />

                            <path
                                className="arrow"
                                d="m205.20251,5.8195c-1.6286,0-2.23545,2.13864-.84385,2.98468,7.34212,4.46376,14.27434,9.87089,20.62076,16.2173,6.34641,6.34641,11.75355,13.27864,16.2173,20.62076.84605,1.3916,2.98468.78476,2.98468-.84385V7.43465c0-.89202-.72313-1.61515-1.61515-1.61515h-37.36375Z"
                                style={{
                                    fill: "white",
                                    opacity: letiant.hidden ? "0" : "1",
                                }}
                            />
                            <path
                                className="arrow"
                                d="m189.34317,28.7299c-1.33399,0-1.83106,1.75177-.6912,2.44477,6.01396,3.65628,11.69217,8.08529,16.89055,13.28366s9.62738,10.87659,13.28366,16.89055c.693,1.13987,2.44477.6428,2.44477-.6912v-30.6048c0-.73066-.59232-1.32298-1.32298-1.32298h-30.6048Z"
                                style={{
                                    fill: "white",
                                    opacity: letiant.hidden ? "0" : "1",
                                    transform: letiant.arrow,
                                }}
                            />
                        </svg>
                    </div>
                    <div
                        id="dexcom_text"
                        className="text-center select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[50%]">
                        <div
                            id="reading"
                            className={twMerge(
                                "text-[86px] font-medium mt-[-6px] text-nowrap",
                                textColor
                            )}>
                            {unitSetting === "mg/dl" ? mg_dl : mmol_l}
                        </div>
                        <div
                            id="unit"
                            className={twMerge(
                                letiant.hidden ? "opacity-0" : "opacity-100",
                                textColor,
                                "text-[24px] font-medium mt-[-20px] text-nowrap"
                            )}>
                            {unitSetting === "mg/dl" ? "mg/dL" : "mmol/L"}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

const trendletiantsG7 = (letiant: Trend) => {
    const letiants = {
        Unavailable: {
            rotate: "rotate-[0deg]",
            reverse: "rotate-[0deg]",
            arrow: "translate(19px, -19px)",
            hidden: true,
        },
        DoubleUp: {
            rotate: "rotate-[-45deg]",
            reverse: "rotate-[45deg]",
            arrow: "translate(0px, 0px)",
            hidden: false,
        },
        SingleUp: {
            rotate: "rotate-[-45deg]",
            reverse: "rotate-[45deg]",
            arrow: "translate(19px, -19px)",
            hidden: false,
        },
        FortyFiveUp: {
            rotate: "rotate-[0deg]",
            reverse: "rotate-[0deg]",
            arrow: "translate(19px, -19px)",
            hidden: false,
        },
        Flat: {
            rotate: "rotate-[45deg]",
            reverse: "rotate-[-45deg]",
            arrow: "translate(19px, -19px)",
            hidden: false,
        },
        FortyFiveDown: {
            rotate: "rotate-[90deg]",
            reverse: "rotate-[-90deg]",
            arrow: "translate(19px, -19px)",
            hidden: false,
        },
        SingleDown: {
            rotate: "rotate-[135deg]",
            reverse: "rotate-[-135deg]",
            arrow: "translate(19px, -19px)",
            hidden: false,
        },
        DoubleDown: {
            rotate: "rotate-[135deg]",
            reverse: "rotate-[-135deg]",
            arrow: "translate(0px, 0px)",
            hidden: false,
        },
    };
    return letiants[letiant];
};

export const DexcomG7 = forwardRef<HTMLDivElement, DexcomProps>(
    ({ trend, mg_dl, mmol_l, children, className, ...props }, ref) => {
        const {
            unitSetting,
            highSetting,
            lowSetting,
            highSettingMMOLL,
            lowSettingMMOLL,
        } = useSettingsContext();

        const high = mg_dl >= highSetting ? true : false;
        const low = mg_dl <= lowSetting ? true : false;
        const highMMOLL = mmol_l >= highSettingMMOLL ? true : false;
        const lowMMOLL = mmol_l <= lowSettingMMOLL ? true : false;

        let circleColor = "#ffffff";
        if (unitSetting == "mg/dl") {
            if (high) {
                circleColor = "#ffcc3d";
            }
            if (low) {
                circleColor = "#f73d45";
            }
        } else {
            if (highMMOLL) {
                circleColor = "#ffcc3d";
            }
            if (lowMMOLL) {
                circleColor = "#f73d45";
            }
        }
        let textColor = "text-[#373737]";
        if (unitSetting == "mg/dl") {
            if (low) {
                textColor = "text-[#ffffff]";
            }
        } else {
            if (lowMMOLL) {
                textColor = "text-[#ffffff]";
            }
        }
        let unitTextColor = "text-[#757575]";
        if (unitSetting == "mg/dl") {
            if (high) {
                unitTextColor = "text-[#373737]";
            }
            if (low) {
                unitTextColor = "text-[#ffffff]";
            }
        } else {
            if (highMMOLL) {
                unitTextColor = "text-[#373737]";
            }
            if (lowMMOLL) {
                unitTextColor = "text-[#ffffff]";
            }
        }

        const letiant = trendletiantsG7(trend);
        return (
            <div
                ref={ref}
                className={twMerge(
                    "flex w-full h-full bg-transparent",
                    className
                )}
                {...props}>
                <div
                    id="dexcom"
                    className="relative scale-dscale w-full h-full -mt-[1%]">
                    <div
                        id="dexcom_body"
                        className={twMerge(
                            letiant.rotate,
                            "drop-shadow-3xl origin-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                        )}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="250"
                            height="250"
                            viewBox="0 0 250 250">
                            <defs>
                                <filter id="shadow">
                                    <feDropShadow
                                        dx="0"
                                        dy="4"
                                        stdDeviation="6"
                                        floodOpacity={0.1}
                                    />
                                </filter>
                            </defs>
                            <path
                                id="dexcom_back"
                                d="m124.99987,0h120.00013c2.76143,0,5,2.23858,5,5v120.00012c0,69.03552-55.96436,124.99988-124.99988,124.99988h-.00025C55.96435,250,0,194.03564,0,125.00013v-.00025C0,55.96436,55.96435,0,124.99987,0h0Z"
                                style={{
                                    fill: "#eeedee",
                                    opacity: letiant.hidden ? "0" : "1",
                                }}
                            />
                            <svg
                                id="circle-NODATA"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 250 250">
                                <circle
                                    cx="125"
                                    cy="125"
                                    r="125"
                                    style={{
                                        fill: "#eeedee",
                                        opacity: letiant.hidden ? "1" : "0",
                                    }}
                                />
                            </svg>
                            <circle
                                id="dexcom_circle"
                                className={twMerge(
                                    letiant.reverse,
                                    "rounded-full origin-center"
                                )}
                                cx="125"
                                cy="125"
                                r="110.6714"
                                style={{
                                    fill: circleColor,
                                    filter:
                                        high || low || highMMOLL || lowMMOLL
                                            ? ""
                                            : "url(#shadow)",
                                }}
                            />
                            <path
                                className="arrow"
                                d="m244.00235,52.98741c0,.54024-.70822.72554-.97695.25688-5.37431-9.37259-12.06315-18.19753-20.06648-26.20086s-16.82823-14.69214-26.20082-20.06644c-.46866-.26873-.28336-.97695.25688-.97695l46.46137-.00004c.2905,0,.526.2355.526.526v46.46141Z"
                                style={{
                                    fill: "#373737",
                                    opacity: letiant.hidden ? "0" : "1",
                                }}
                            />
                            <path
                                className="arrow"
                                d="m221.48802,59.49568c.00011.52077-.66787.72109-.95812.28871-3.9377-5.86588-8.49775-11.44028-13.68566-16.62819-5.18795-5.18795-10.76235-9.748-16.62823-13.6857-.43238-.29025-.23206-.95824.28871-.95812l30.45087.00659c.29041.00006.52582.23547.52588.52589l.00655,30.45083Z"
                                style={{
                                    fill: "#373737",
                                    opacity: letiant.hidden ? "0" : "1",
                                    transform: letiant.arrow,
                                }}
                            />
                        </svg>
                    </div>
                    <div
                        id="dexcom_text"
                        className="text-center select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[50%]">
                        <div
                            id="reading"
                            className={twMerge(
                                textColor,
                                "text-[84px] font-medium mt-[-5px] text-nowrap"
                            )}>
                            {unitSetting === "mg/dl" ? mg_dl : mmol_l}
                        </div>
                        <div
                            id="unit"
                            className={twMerge(
                                unitTextColor,
                                letiant.hidden ? "opacity-0" : "opacity-100",
                                "text-[24px] font-medium mt-[-19px] text-nowrap"
                            )}>
                            {unitSetting === "mg/dl" ? "mg/dL" : "mmol/L"}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);
