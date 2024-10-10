import { createRoot } from "react-dom/client";
import SettingsContextProvider from "../contexts/SettingsContext";
import Widget from "./Widget";
import "./widget.css";

const root = createRoot(document.body);
root.render(
    <SettingsContextProvider>
        <Widget />
    </SettingsContextProvider>
);
