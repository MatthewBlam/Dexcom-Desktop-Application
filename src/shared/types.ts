export type Trend =
    | "Unavailable"
    | "DoubleUp"
    | "SingleUp"
    | "FortyFiveUp"
    | "Flat"
    | "FortyFiveDown"
    | "SingleDown"
    | "DoubleDown";

export interface Reading {
    id: string;
    value: number;
    mmol_l: number;
    trend: number;
    trend_direction: string;
    trend_description: string;
    trend_arrow: string;
    date_time: Array<string>;
}

export interface Settings {
    sensor: "G6" | "G7";
    unit: "mg/dl" | "mmol/l";
    high: number;
    low: number;
    highMMOLL: number;
    lowMMOLL: number;
}

export interface Credentials {
    user: string;
    password: string;
    ous: boolean;
}

export interface WindowBounds {
    width: number;
    height: number;
}

export const DEFAULT_READING: Reading = {
    id: "Unavailable",
    value: -1,
    mmol_l: -1,
    trend: 0,
    trend_direction: "Unavailable",
    trend_description: "Unavailable",
    trend_arrow: "Unavailable",
    date_time: ["Unavailable", "Unavailable"],
};

export const DEFAULT_SETTINGS: Settings = {
    sensor: "G7",
    unit: "mg/dl",
    high: 200,
    low: 70,
    highMMOLL: 11.0,
    lowMMOLL: 4.0,
};
