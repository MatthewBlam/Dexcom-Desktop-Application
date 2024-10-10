import { createRoot } from "react-dom/client";
import App from "./App";
import "./main.css";
import SettingsContextProvider from "../contexts/SettingsContext";
import HistoryContextProvider from "../contexts/HistoryContext";

const root = createRoot(document.body);
root.render(
    <SettingsContextProvider>
        <HistoryContextProvider>
            <App />
        </HistoryContextProvider>
    </SettingsContextProvider>
);
