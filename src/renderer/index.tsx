import { createRoot } from "react-dom/client";
import App from "./App";
import "./main.css";
import SettingsContextProvider from "../contexts/SettingsContext";
import HistoryContextProvider from "../contexts/HistoryContext";
import { ErrorBoundary } from "../components/ErrorBoundary";

document.getElementById("container")?.remove();

const root = createRoot(document.body);
root.render(
    <ErrorBoundary>
        <SettingsContextProvider>
            <HistoryContextProvider>
                <App />
            </HistoryContextProvider>
        </SettingsContextProvider>
    </ErrorBoundary>
);
