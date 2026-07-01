import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { Settings, DEFAULT_SETTINGS } from "../shared/types";

interface SettingsContextValue {
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export interface SettingsContextProviderProps {
  children: ReactNode;
}

export default function SettingsContextProvider({
  children,
}: SettingsContextProviderProps) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error(
      "useSettingsContext must be used within a SettingsContextProvider",
    );
  }
  return context;
}
