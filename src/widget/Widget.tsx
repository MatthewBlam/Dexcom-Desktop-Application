import { StrictMode, useEffect, useRef, useState } from "react";
import { RootLayout } from "../components/RootLayout";
import "inter-ui/inter.css";
import { useSettingsContext } from "../contexts/SettingsContext";
import { DexcomG6, DexcomG7 } from "../components/Dexcom";
import { motion } from "motion/react";
import { Reading, Settings, DEFAULT_READING } from "../shared/types";
import { formatReading } from "../shared/reading-utils";

const Widget = () => {
    const [mouseInteractive, setMouseInteractive] = useState(false);

    const [widgetPosition, setWidgetPosition] = useState(["0px", "0px"]);

    const {
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
    } = useSettingsContext();

    function applySettings(settings: Settings) {
        setSensorSetting(settings.sensor);
        setUnitSetting(settings.unit);
        setHighSetting(settings.high);
        setLowSetting(settings.low);
        setHighSettingMMOLL(settings.highMMOLL);
        setLowSettingMMOLL(settings.lowMMOLL);
    }

    const G7theme = sensorSetting === "G7";

    const containerRef = useRef<HTMLDivElement | null>(null);

    const [reading, setReading] = useState<Reading>(DEFAULT_READING);
    const { trend, mg_dl, mmol_l } = formatReading(reading);

    function widgetDragHandler() {
        const widgey = containerRef.current?.firstChild as HTMLElement | undefined;
        if (!widgey) return;
        const bounds = widgey.getBoundingClientRect();
        const left = String(bounds.left) + "px";
        const top = String(bounds.top) + "px";
        window.api.saveWidgetPosition([left, top]);
    }

    useEffect(() => {
        const widgey = containerRef.current?.firstChild as HTMLElement | undefined;
        if (!widgey) return;
        widgey.style.left = widgetPosition[0];
        widgey.style.top = widgetPosition[1];
    }, [widgetPosition]);

    useEffect(() => {
        setMouseInteractive(false);
        const interactiveElements = document.querySelectorAll(".interactive");
        const mouseHandlers: Array<{ element: Element; type: string; handler: () => void }> = [];
        interactiveElements.forEach((element) => {
            const enterHandler = () => {
                setMouseInteractive(true);
                window.api.setIgnoreMouseEvents(false, null);
            };
            const leaveHandler = () => {
                setMouseInteractive(false);
                window.api.setIgnoreMouseEvents(true, { forward: true });
            };
            element.addEventListener("mouseenter", enterHandler);
            element.addEventListener("mouseleave", leaveHandler);
            mouseHandlers.push(
                { element, type: "mouseenter", handler: enterHandler },
                { element, type: "mouseleave", handler: leaveHandler },
            );
        });

        const widgey = containerRef.current?.firstChild as HTMLElement | undefined;
        if (!widgey) return;
        if (!widgetPosition) {
            widgey.style.left = "0px";
            widgey.style.top = "0px";
            setWidgetPosition(["0px", "0px"]);
        }
        widgey.style.left = widgetPosition[0];
        widgey.style.top = widgetPosition[1];

        // Fetch initial state
        window.api.getWidgetPosition().then((pos) => {
            setWidgetPosition(pos);
        });
        window.api.getCurrentReading().then((r) => {
            setReading(r);
        });
        window.api.getSettings().then((settings) => {
            applySettings(settings);
        });
        window.api.setIgnoreMouseEvents(true, { forward: true });

        // Subscribe to push events
        const unsubs = [
            window.api.onSettings((settings) => {
                applySettings(settings);
            }),
            window.api.onReading((r) => {
                setReading(r);
            }),
        ];

        return () => {
            unsubs.forEach((fn) => fn());
            mouseHandlers.forEach(({ element, type, handler }) => {
                element.removeEventListener(type, handler);
            });
        };
    }, []);

    return (
        <StrictMode>
            <RootLayout duration={0.3} delay={0}>
                <motion.div
                    className="w-full h-full bg-transparent"
                    ref={containerRef}>
                    <motion.div
                        drag={true}
                        dragConstraints={containerRef}
                        dragMomentum={false}
                        className="absolute interactive size-[125px] bg-transparent"
                        onDragEnd={() => {
                            widgetDragHandler();
                        }}>
                        {G7theme ? (
                            <DexcomG7
                                trend={trend}
                                mg_dl={String(mg_dl)}
                                mmol_l={String(mmol_l)}></DexcomG7>
                        ) : (
                            <DexcomG6
                                trend={trend}
                                mg_dl={String(mg_dl)}
                                mmol_l={String(mmol_l)}></DexcomG6>
                        )}
                    </motion.div>
                </motion.div>
            </RootLayout>
        </StrictMode>
    );
};

export default Widget;
