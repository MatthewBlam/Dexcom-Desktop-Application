import { createContext, ReactNode, useContext, useState } from "react";
import { Reading } from "../shared/types";

interface HistoryContextValue {
    historyItems: Reading[];
    setHistoryItems: React.Dispatch<React.SetStateAction<Reading[]>>;
}

export const HistoryContext = createContext<HistoryContextValue | null>(null);

export interface HistoryContextProviderProps {
    children: ReactNode;
}

export default function HistoryContextProvider({
    children,
}: HistoryContextProviderProps) {
    const [historyItems, setHistoryItems] = useState<Reading[]>([]);
    return (
        <HistoryContext.Provider
            value={{
                historyItems,
                setHistoryItems,
            }}>
            {children}
        </HistoryContext.Provider>
    );
}

export function useHistoryContext() {
    const context = useContext(HistoryContext);
    if (!context) {
        throw new Error(
            "useHistoryContext must be used within a HistoryContext.Providor"
        );
    }
    return context;
}
