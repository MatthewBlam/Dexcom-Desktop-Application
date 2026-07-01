import { StrictMode, useEffect, useRef, useState } from "react";
import { RootLayout } from "../components/RootLayout";
import "inter-ui/inter.css";
import { useSettingsContext } from "../contexts/SettingsContext";
import { DexcomG6, DexcomG7 } from "../components/Dexcom";
import { motion } from "motion/react";
import { Reading, DEFAULT_READING } from "../shared/types";
import { formatReading } from "../shared/reading-utils";
import { Sparkline } from "../components/Sparkline";

const Widget = () => {
  const [mouseInteractive, setMouseInteractive] = useState(false);
  const [widgetPosition, setWidgetPosition] = useState<{ left: number; top: number } | null>(null);

  const { settings: currentSettings, setSettings } = useSettingsContext();

  const widgetPixelSize = 125;

  const G7theme = currentSettings.sensor === "G7";

  const containerRef = useRef<HTMLDivElement | null>(null);

  const [reading, setReading] = useState<Reading>(DEFAULT_READING);
  const [readings, setReadings] = useState<Reading[]>([]);
  const { trend, mg_dl, mmol_l } = formatReading(reading);

  function savePosition() {
    const widgey = containerRef.current?.firstChild as HTMLElement | undefined;
    if (!widgey) return;
    const bounds = widgey.getBoundingClientRect();
    window.api.saveWidgetPosition([`${bounds.left}px`, `${bounds.top}px`]).catch(() => {});
  }

  useEffect(() => {
    window.api
      .getWidgetPosition()
      .then((pos) => {
        setWidgetPosition({ left: parseFloat(pos[0]) || 0, top: parseFloat(pos[1]) || 0 });
      })
      .catch(() => {
        setWidgetPosition({ left: 0, top: 0 });
      });
    window.api
      .getCurrentReading()
      .then((r) => {
        setReading(r);
      })
      .catch(() => {});
    window.api
      .getSettings()
      .then((s) => {
        setSettings(s);
      })
      .catch(() => {});
    window.api
      .getHistory(60)
      .then((history) => {
        setReadings(history);
      })
      .catch(() => {});
    window.api.setIgnoreMouseEvents(true, { forward: true }).catch(() => {});

    const unsubs = [
      window.api.onSettings((s) => {
        setSettings(s);
      }),
      window.api.onReading((r) => {
        setReading(r);
        setReadings((prev) => [r, ...prev].slice(0, 300));
      }),
      window.api.onHistoryBackfill((history) => {
        setReadings(history);
      }),
    ];

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, []);

  useEffect(() => {
    if (!widgetPosition) return;
    const interactiveElements = document.querySelectorAll(".interactive");
    const mouseHandlers: Array<{ element: Element; type: string; handler: () => void }> = [];
    interactiveElements.forEach((element) => {
      const enterHandler = () => {
        setMouseInteractive(true);
        window.api.setIgnoreMouseEvents(false, null).catch(() => {});
      };
      const leaveHandler = () => {
        setMouseInteractive(false);
        window.api.setIgnoreMouseEvents(true, { forward: true }).catch(() => {});
      };
      element.addEventListener("mouseenter", enterHandler);
      element.addEventListener("mouseleave", leaveHandler);
      mouseHandlers.push({ element, type: "mouseenter", handler: enterHandler }, { element, type: "mouseleave", handler: leaveHandler });
    });

    return () => {
      mouseHandlers.forEach(({ element, type, handler }) => {
        element.removeEventListener(type, handler);
      });
    };
  }, [widgetPosition]);

  return (
    <StrictMode>
      <RootLayout duration={0.3} delay={0}>
        <motion.div className="w-full h-full bg-transparent" ref={containerRef}>
          {widgetPosition && (
            <motion.div
              drag={true}
              dragConstraints={containerRef}
              dragMomentum={false}
              className="absolute interactive flex flex-col items-center"
              style={{
                left: widgetPosition.left,
                top: widgetPosition.top,
                width: widgetPixelSize,
                opacity: currentSettings.widgetOpacity,
              }}
              onDragEnd={savePosition}>
              {currentSettings.widgetShowIndicator && (
                <div style={{ width: widgetPixelSize, height: widgetPixelSize }}>
                  {G7theme ? <DexcomG7 trend={trend} mg_dl={String(mg_dl)} mmol_l={String(mmol_l)}></DexcomG7> : <DexcomG6 trend={trend} mg_dl={String(mg_dl)} mmol_l={String(mmol_l)}></DexcomG6>}
                </div>
              )}
              {currentSettings.widgetShowSparkline && (
                <div className="mt-2 rounded-lg px-3 py-3 pointer-events-none bg-white shadow-md">
                  <Sparkline readings={readings} width={widgetPixelSize - 24} height={24} />
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </RootLayout>
    </StrictMode>
  );
};

export default Widget;
