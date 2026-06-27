import { useMemo } from "react";
import { useHistoryContext } from "../contexts/HistoryContext";
import { useSettingsContext } from "../contexts/SettingsContext";
import { calculateRateOfChange } from "../shared/reading-utils";

export function RateOfChange() {
    const { historyItems } = useHistoryContext();
    const { unitSetting } = useSettingsContext();

    const roc = useMemo(
        () => calculateRateOfChange(historyItems, unitSetting),
        [historyItems, unitSetting]
    );

    if (!roc) return null;

    const colorClass =
        roc.severity === "rapid"
            ? "text-dex-red"
            : roc.severity === "moderate"
              ? "text-dex-yellow"
              : "text-dex-green";

    const unitLabel = unitSetting === "mg/dl" ? "mg/dL" : "mmol/L";

    return (
        <span className={`text-xs font-medium ${colorClass}`}>
            {roc.formatted} {unitLabel}/min
        </span>
    );
}
