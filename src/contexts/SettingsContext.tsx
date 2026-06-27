import { createContext, ReactNode, useContext, useState } from "react";

interface SettingsContextValue {
    sensorSetting: "G6" | "G7";
    setSensorSetting: React.Dispatch<React.SetStateAction<"G6" | "G7">>;
    unitSetting: "mg/dl" | "mmol/l";
    setUnitSetting: React.Dispatch<React.SetStateAction<"mg/dl" | "mmol/l">>;
    highSetting: number;
    setHighSetting: React.Dispatch<React.SetStateAction<number>>;
    lowSetting: number;
    setLowSetting: React.Dispatch<React.SetStateAction<number>>;
    highSettingMMOLL: number;
    setHighSettingMMOLL: React.Dispatch<React.SetStateAction<number>>;
    lowSettingMMOLL: number;
    setLowSettingMMOLL: React.Dispatch<React.SetStateAction<number>>;
    criticalLowSetting: number;
    setCriticalLowSetting: React.Dispatch<React.SetStateAction<number>>;
    criticalLowSettingMMOLL: number;
    setCriticalLowSettingMMOLL: React.Dispatch<React.SetStateAction<number>>;
    launchAtLoginSetting: boolean;
    setLaunchAtLoginSetting: React.Dispatch<React.SetStateAction<boolean>>;
    widgetOpacitySetting: number;
    setWidgetOpacitySetting: React.Dispatch<React.SetStateAction<number>>;
    widgetShowIndicatorSetting: boolean;
    setWidgetShowIndicatorSetting: React.Dispatch<React.SetStateAction<boolean>>;
    widgetShowSparklineSetting: boolean;
    setWidgetShowSparklineSetting: React.Dispatch<React.SetStateAction<boolean>>;
    widgetOpen: boolean;
    setWidgetOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export interface SettingsContextProviderProps {
    children: ReactNode;
}

export default function SettingsContextProvider({
    children,
}: SettingsContextProviderProps) {
    const [sensorSetting, setSensorSetting] = useState<"G6" | "G7">("G7");
    const [unitSetting, setUnitSetting] = useState<"mg/dl" | "mmol/l">("mg/dl");
    const [highSetting, setHighSetting] = useState<number>(200);
    const [lowSetting, setLowSetting] = useState<number>(70);
    const [highSettingMMOLL, setHighSettingMMOLL] = useState<number>(11.0);
    const [lowSettingMMOLL, setLowSettingMMOLL] = useState<number>(4.0);
    const [criticalLowSetting, setCriticalLowSetting] = useState<number>(55);
    const [criticalLowSettingMMOLL, setCriticalLowSettingMMOLL] = useState<number>(3.0);
    const [launchAtLoginSetting, setLaunchAtLoginSetting] = useState<boolean>(false);
    const [widgetOpacitySetting, setWidgetOpacitySetting] = useState<number>(1.0);
    const [widgetShowIndicatorSetting, setWidgetShowIndicatorSetting] = useState<boolean>(true);
    const [widgetShowSparklineSetting, setWidgetShowSparklineSetting] = useState<boolean>(true);
    const [widgetOpen, setWidgetOpen] = useState<boolean>(false);
    return (
        <SettingsContext.Provider
            value={{
                sensorSetting,
                setSensorSetting,
                unitSetting,
                setUnitSetting,
                highSetting,
                setHighSetting,
                lowSetting,
                setLowSetting,
                highSettingMMOLL,
                setHighSettingMMOLL,
                lowSettingMMOLL,
                setLowSettingMMOLL,
                criticalLowSetting,
                setCriticalLowSetting,
                criticalLowSettingMMOLL,
                setCriticalLowSettingMMOLL,
                launchAtLoginSetting,
                setLaunchAtLoginSetting,
                widgetOpacitySetting,
                setWidgetOpacitySetting,
                widgetShowIndicatorSetting,
                setWidgetShowIndicatorSetting,
                widgetShowSparklineSetting,
                setWidgetShowSparklineSetting,
                widgetOpen,
                setWidgetOpen,
            }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettingsContext() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error(
            "useSettingsContext must be used within a SettingsContext.Providor"
        );
    }
    return context;
}
