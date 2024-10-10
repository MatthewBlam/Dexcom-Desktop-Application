import { createContext, ReactNode, useContext, useState } from "react";

export const SettingsContext = createContext(null);

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
