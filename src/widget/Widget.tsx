import { useCallback, StrictMode, useEffect, useRef, useState } from "react";
import { RootLayout } from "../components/RootLayout";
import "inter-ui/inter.css";
import { useSettingsContext } from "../contexts/SettingsContext";
import { DexcomG6, DexcomG7 } from "../components/Dexcom";
import { motion } from "framer-motion";

type Trend =
    | "Unavailable"
    | "DoubleUp"
    | "SingleUp"
    | "FortyFiveUp"
    | "Flat"
    | "FortyFiveDown"
    | "SingleDown"
    | "DoubleDown";

interface Reading {
    id: string;
    value: number;
    mmol_l: number;
    trend: number;
    trend_direction: string;
    trend_description: string;
    trend_arrow: string;
    date_time: Array<string>;
}

interface Settings {
    sensor: "G6" | "G7";
    unit: "mg/dl" | "mmol/l";
    high: number;
    low: number;
    highMMOLL: number;
    lowMMOLL: number;
}

const Widget = () => {
    const sendMain = useCallback((message: object) => {
        window.api.send("toMain", JSON.stringify(message));
    }, []);

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

    function setSettings(settings: Settings) {
        setSensorSetting(settings.sensor);
        setUnitSetting(settings.unit);
        setHighSetting(settings.high);
        setLowSetting(settings.low);
        setHighSettingMMOLL(settings.highMMOLL);
        setLowSettingMMOLL(settings.lowMMOLL);
    }

    const G7theme = sensorSetting === "G7" ? true : false;

    const containerRef = useRef<HTMLDivElement | null>(null);

    const [reading, setReading] = useState<Reading>({
        id: "Unavailable",
        value: -1,
        mmol_l: -1,
        trend: 0,
        trend_direction: "Unavailable",
        trend_description: "Unavailable",
        trend_arrow: "Unavailable",
        date_time: ["Unavailable", "Unavailable"],
    });

    var t = reading.trend_direction;
    if (t == "None" || t == "NotComputable" || t == "RateOutOfRange") {
        t = "Unavailable";
    }
    var v;
    if (reading.value == -1) {
        v = "--";
    } else {
        v = reading.value;
    }
    var m;
    if (reading.mmol_l == -1) {
        m = "--";
    } else {
        m = reading.mmol_l;
    }
    const trend: Trend = t as Trend;
    const mg_dl = v;
    const mmol_l = m;

    function widgetDragHandler() {
        const widgey = containerRef.current.firstChild as HTMLElement;
        const bounds = widgey.getBoundingClientRect();
        const left = String(bounds.left) + "px";
        const top = String(bounds.top) + "px";
        console.log(left, top);
        sendMain({ STORE_WIDGET: [left, top] });
    }

    useEffect(() => {
        const widgey = containerRef.current.firstChild as HTMLElement;
        widgey.style.left = widgetPosition[0];
        widgey.style.top = widgetPosition[1];
    }, widgetPosition);

    useEffect(() => {
        setMouseInteractive(false);
        const interactiveElements = document.querySelectorAll(".interactive");
        interactiveElements.forEach((element) => {
            element.addEventListener("mouseenter", () => {
                setMouseInteractive(true);
                sendMain({ SET_IGNORE_MOUSE: [false, null] });
            });

            element.addEventListener("mouseleave", () => {
                setMouseInteractive(false);
                sendMain({
                    SET_IGNORE_MOUSE: [true, { forward: true }],
                });
            });
        });

        sendMain({ GET_WIDGET: null });

        const widgey = containerRef.current.firstChild as HTMLElement;
        if (!widgetPosition) {
            widgey.style.left = "0px";
            widgey.style.top = "0px";
            setWidgetPosition(["0px", "0px"]);
        }
        widgey.style.left = widgetPosition[0];
        widgey.style.top = widgetPosition[1];

        sendMain({ GET_READING: null });

        sendMain({ INIT_WIDGET_SETTINGS: null });

        sendMain({
            SET_IGNORE_MOUSE: [true, { forward: true }],
        });

        window.api.receive("toRender", (data: string) => {
            var values = JSON.parse(data);
            var keys = Object.keys(values);
            var call = keys[0];

            if (call == "WIDGET_POSITION") {
                setWidgetPosition(values["WIDGET_POSITION"]);
            }

            if (call == "SETTINGS") {
                setSettings(values["SETTINGS"]);
            }

            if (call == "READING") {
                const reading = values["READING"];
                console.log("Received Reading:", reading);
                setReading(reading);
            }
        });
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
