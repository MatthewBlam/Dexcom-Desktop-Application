import { createContext, ReactNode, useContext, useState } from "react";

export const HistoryContext = createContext(null);

export interface HistoryContextProviderProps {
    children: ReactNode;
}

export default function HistoryContextProvider({
    children,
}: HistoryContextProviderProps) {
    const [historyItems, setHistoryItems] = useState([]);
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
