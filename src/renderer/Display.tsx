import { ComponentProps, forwardRef, MouseEventHandler } from "react";
import { twMerge } from "tailwind-merge";
import { Button } from "../components/Button";
import { DexcomG6, DexcomG7 } from "../components/Dexcom";
import { useSettingsContext } from "../contexts/SettingsContext";
import { Settings, Expand, Shrink } from "lucide-react";
import { History } from "../components/History";
import { Reading, ConnectionStatus } from "../shared/types";
import { formatReading } from "../shared/reading-utils";

export interface DisplayProps extends ComponentProps<"div"> {
  reading: Reading;
  connectionStatus: ConnectionStatus;
  isStale: boolean;
  openSettings: MouseEventHandler;
  toggleWidget: MouseEventHandler;
  widgetOpen: boolean;
  tabbable: boolean;
  historyExpanded: boolean;
  onToggleHistoryExpanded: () => void;
}

export const Display = forwardRef<HTMLDivElement, DisplayProps>(
  ({ reading, connectionStatus, isStale, openSettings, toggleWidget, widgetOpen, tabbable, historyExpanded, onToggleHistoryExpanded, children, className, ...props }, ref) => {
    const { settings } = useSettingsContext();
    const { trend, mg_dl, mmol_l } = formatReading(reading);

    return (
      <div ref={ref} className={twMerge("flex flex-col w-full h-full px-8 py-5", className)} {...props}>
        <div className="flex flex-col w-full flex-1 min-h-0">
          <div className="w-full flex flex-row gap-4 shrink-0">
            <Button
              className="bg-dex-bg hover:bg-dex-fg-light"
              Icon={() => {
                return <Settings className="size-[17.5px] mr-1.5" strokeWidth={2.1} />;
              }}
              tabbable={tabbable}
              click={openSettings}
              text="Settings"></Button>

            <Button
              className="ml-auto bg-dex-bg hover:bg-dex-fg-light"
              Icon={() => {
                if (widgetOpen) {
                  return <Shrink className="size-4 mr-1.5" strokeWidth={2.1} />;
                }
                return <Expand className="size-[15px] mr-1.5" strokeWidth={2.1} />;
              }}
              tabbable={tabbable}
              click={toggleWidget}
              text={widgetOpen ? "Close Widget" : "Open Widget"}></Button>
          </div>
          <div className="relative w-full flex-1 min-h-0 mb-1">
            {settings.sensor === "G7" ? <DexcomG7 trend={trend} mg_dl={String(mg_dl)} mmol_l={String(mmol_l)}></DexcomG7> : <DexcomG6 trend={trend} mg_dl={String(mg_dl)} mmol_l={String(mmol_l)}></DexcomG6>}
          </div>
          <History open={true} expanded={historyExpanded} onToggleExpanded={onToggleHistoryExpanded} connectionStatus={connectionStatus} isStale={isStale} className=""></History>
        </div>
      </div>
    );
  },
);
