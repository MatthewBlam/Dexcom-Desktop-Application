import { StrictMode, useCallback, useEffect, useState, useRef } from "react";
import { useSettingsContext } from "../contexts/SettingsContext";
import { useHistoryContext } from "../contexts/HistoryContext";
import { DraggableTopBar } from "../components/DraggableTopBar";
import { RootLayout } from "../components/RootLayout";
import { ErrorToast } from "../components/ErrorToast";
import { Settings } from "../components/Settings";
import { Button } from "../components/Button";
import { Dimmer, DimmerFlashing } from "../components/Dimmer";
import { motion, useAnimate } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { Display } from "./Display";
import { Login } from "./Login";
import "inter-ui/inter.css";
import clsx from "clsx";

interface Settings {
    sensor: "G6" | "G7";
    unit: "mg/dl" | "mmol/l";
    high: number;
    low: number;
    highMMOLL: number;
    lowMMOLL: number;
}

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

const variants = {
    hidden: { opacity: 0, scale: 0, x: "-50%", y: "-50%" },
    visible: { opacity: 1, scale: 1, x: "-50%", y: "-50%" },
};

const App = () => {
    const sendMain = useCallback((message: object) => {
        window.api.send("toMain", JSON.stringify(message));
    }, []);

    const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
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

    const G7theme = sensorSetting === "G7" ? true : false;
    if (G7theme) {
        document.body.style.backgroundColor = "#e6e6e6";
    } else {
        document.body.style.backgroundColor = "#ffffff";
    }

    const [sensorState, setSensorState] = useState(null);
    const [unitState, setUnitState] = useState(null);
    const [highState, setHighState] = useState(null);
    const [lowState, setLowState] = useState(null);
    const [highMMOLLState, setHighMMOLLState] = useState(null);
    const [lowMMOLLState, setLowMMOLLState] = useState(null);
    const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

    function openSettings() {
        sendMain({ GET_SETTINGS: null });
    }

    function closeSettings() {
        setDimmerOn(false);
        setSettingsOpen(false);
    }

    function setSettings(settings: Settings) {
        console.log("UPDATING SETTINGS WITH RETRIEVED", settings);
        setSensorSetting(settings.sensor);
        setUnitSetting(settings.unit);
        setHighSetting(settings.high);
        setLowSetting(settings.low);
        setHighSettingMMOLL(settings.highMMOLL);
        setLowSettingMMOLL(settings.lowMMOLL);

        setSensorState(settings.sensor);
        setUnitState(settings.unit);
        setHighState(settings.high);
        setLowState(settings.low);
        setHighMMOLLState(settings.highMMOLL);
        setLowMMOLLState(settings.lowMMOLL);
    }

    function storeSettings(settings: Settings) {
        sendMain({ STORE_SETTINGS: settings });
        setSettings(settings);
    }

    function toggleWidget() {
        if (!widgetOpen) {
            setWidgetOpen(true);
            sendMain({ OPEN_WIDGET: null });
        } else {
            setWidgetOpen(false);
            sendMain({ CLOSE_WIDGET: null });
        }
    }

    const hasPageRendered = useRef(false);
    useEffect(() => {
        if (!hasPageRendered.current) {
            hasPageRendered.current = true;
            return;
        }
        sendMain({ STORE_WIDGET_OPEN: widgetOpen });
    }, [widgetOpen]);

    const [LOADED, setLOADED] = useState<boolean>(false);
    const [CREDENTIALS, setCREDENTIALS] = useState<boolean>(false);

    const [userVal, setUserVal] = useState<string>("");
    const [passwordVal, setPasswordVal] = useState<string>("");
    const [ousChecked, setOusChecked] = useState<boolean>(false);
    const [disableForm, setDisableForm] = useState<boolean>(false);
    const [errorText, setErrorText] = useState<string>("Error");
    const [errorActive, setErrorActive] = useState<boolean>(false);

    const userChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUserVal(event.target.value);
    };

    const passwordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordVal(event.target.value);
    };

    const ousChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setOusChecked(event.target.checked);
    };

    const loginClick = () => {
        if (userVal == "" || passwordVal == "") {
            setErrorText("Please provide both email and password");
            setErrorActive(true);
            setCREDENTIALS(undefined);
            setDisableForm(false);
            return;
        }
        setErrorActive(false);
        setDisableForm(true);
        sendMain({
            LOGIN: { user: userVal, password: passwordVal, ous: ousChecked },
        });
    };

    const logoutClick = () => {
        sendMain({ TERMINATE: "TERMINATE" });
        if (widgetOpen) {
            toggleWidget();
        }
        sendMain({ STORE_WIDGET_OPEN: false });
        setErrorActive(false);
        setDisableForm(false);
        setCREDENTIALS(false);
        sessionStorage.clear();
        setDimmerFlashingOn(true);
    };

    const [dimmerOn, setDimmerOn] = useState<boolean>(false);
    const [dimmerFlashingOn, setDimmerFlashingOn] = useState<boolean>(false);
    const [loginOpen, setLoginOpen] = useState<boolean>(true);
    const [loginScope, loginAnimate] = useAnimate();
    const [displayOpen, setDisplayOpen] = useState<boolean>(true);
    const [displayScope, displayAnimate] = useAnimate();

    function closeLoginPage() {
        loginAnimate(
            loginScope.current,
            { x: "-200%" },
            { type: "tween", ease: "easeInOut" }
        );
        setLoginOpen(false);
    }

    function closeDisplayPage() {
        if (widgetOpen) {
            toggleWidget();
        }
        displayAnimate(
            displayScope.current,
            { x: "200%" },
            { type: "tween", ease: "easeInOut" }
        );
        setDisplayOpen(false);
    }

    function openLoginPage() {
        if (widgetOpen) {
            toggleWidget();
        }
        setDimmerOn(false);
        setUserVal("");
        setPasswordVal("");
        setOusChecked(false);
        loginAnimate(
            loginScope.current,
            { x: "-50%" },
            { type: "tween", ease: "easeInOut" }
        );
        closeDisplayPage();
        setLoginOpen(true);
    }

    function openDisplayPage() {
        displayAnimate(
            displayScope.current,
            { x: "-50%" },
            { type: "tween", ease: "easeInOut" }
        );
        closeLoginPage();
        setDisplayOpen(true);
    }

    const [confirmOpen, setConfirmOpen] = useState<boolean>(false);

    function openConfirm() {
        setDimmerOn(true);
        setConfirmOpen(true);
    }

    function closeConfirm(logout = false) {
        if (!logout) {
            setDimmerOn(false);
        }
        setConfirmOpen(false);
    }

    const [currentReading, setCurrentReading] = useState<Reading>({
        id: "Unavailable",
        value: -1,
        mmol_l: -1,
        trend: 0,
        trend_direction: "Unavailable",
        trend_description: "Unavailable",
        trend_arrow: "Unavailable",
        date_time: ["Unavailable", "Unavailable"],
    });
    const { historyItems, setHistoryItems } = useHistoryContext();

    const [pythonError, setPythonError] = useState(false);

    function openPythonError() {
        setDimmerOn(true);
        setPythonError(true);
    }

    function closePythonError() {
        setDimmerOn(false);
        setPythonError(false);
    }

    function restartApp() {
        sendMain({ RESTART: null });
    }

    useEffect(() => {
        closeLoginPage();
        closeDisplayPage();

        sendMain({ DOM: null });
        sendMain({ GET_WIDGET_OPEN: null });

        var session = sessionStorage.getItem("session");
        if (session) {
            setCREDENTIALS(true);
            setLOADED(true);
            openDisplayPage();
        }

        window.api.receive("toRender", (data: string) => {
            const values = JSON.parse(data);
            const keys = Object.keys(values);
            const call = keys[0];

            if (call == "PYTHON_ERROR") {
                openPythonError();
            }

            if (call == "AUTH_ERROR") {
                setLOADED(true);
                const error = values["AUTH_ERROR"];
                if (error) {
                    setErrorText(error);
                    setErrorActive(true);
                }
                setCREDENTIALS(undefined);
                setUserVal("");
                setPasswordVal("");
                setDisableForm(false);
                openLoginPage();
            }

            if (call == "CREDENTIALS") {
                setLOADED(true);
                setCREDENTIALS(true);
                openDisplayPage();
                sessionStorage.setItem("session", "true");
            }

            if (call == "INIT_SETTINGS") {
                setSettings(values["INIT_SETTINGS"]);
                setIsSettingsLoaded(true);
            }

            if (call == "OPEN_SETTINGS") {
                setSettings(values["OPEN_SETTINGS"]);
                setDimmerOn(true);
                setSettingsOpen(true);
            }

            if (call == "KILLED_PYTHON") {
                setDimmerFlashingOn(false);
                openLoginPage();
            }

            if (call == "WIDGET_OPEN") {
                if (CREDENTIALS) {
                    const open = values["WIDGET_OPEN"];
                    setWidgetOpen(false);
                    if (open) {
                        toggleWidget();
                    }
                }
            }

            if (call == "CLOSE_WIDGET") {
                setWidgetOpen(false);
            }

            if (call == "READING") {
                const newReading = values["READING"];
                console.log("Received Reading:", newReading);
                setCurrentReading(newReading);
                setHistoryItems((historyItems: string | any[]) =>
                    [newReading].concat(historyItems)
                );
                sendMain({ STORE_READING: newReading });
            }
        });
    }, []);

    return (
        <StrictMode>
            <DraggableTopBar></DraggableTopBar>
            <RootLayout
                duration={1}
                delay={0.5}
                className={twMerge(
                    "mt-10 w-full",
                    G7theme ? "bg-dex-fg" : "bg-dex-bg",
                    clsx({ hidden: !LOADED })
                )}>
                <motion.div
                    ref={loginScope}
                    className={twMerge(
                        "absolute left-1/2 -translate-x-1/2 w-full h-full flex justify-center items-center",
                        clsx({ "pointer-events-none": CREDENTIALS })
                    )}>
                    <Login
                        userVal={userVal}
                        passwordVal={passwordVal}
                        ousChecked={ousChecked}
                        userChange={userChange}
                        ousChange={ousChange}
                        passwordChange={passwordChange}
                        loginClick={loginClick}
                        disabled={disableForm}
                        tabbable={
                            CREDENTIALS || settingsOpen || confirmOpen
                                ? false
                                : true
                        }></Login>
                </motion.div>

                <motion.div
                    ref={displayScope}
                    className={twMerge(
                        "absolute left-1/2 -translate-x-1/2 w-full h-full flex flex-col justify-center items-center",
                        clsx({
                            "pointer-events-none": !CREDENTIALS,
                        })
                    )}>
                    <Display
                        reading={currentReading}
                        openSettings={openSettings}
                        toggleWidget={toggleWidget}
                        widgetOpen={widgetOpen}
                        tabbable={
                            !CREDENTIALS || settingsOpen || confirmOpen
                                ? false
                                : true
                        }></Display>
                </motion.div>

                <ErrorToast
                    className="absolute left-1/2 -translate-x-1/2 bottom-[-384px] max-w-[90%]"
                    active={errorActive}
                    text={errorText}
                    close={() => {
                        setErrorActive(false);
                    }}></ErrorToast>
            </RootLayout>

            <Dimmer active={dimmerOn}></Dimmer>
            <DimmerFlashing active={dimmerFlashingOn}></DimmerFlashing>

            {isSettingsLoaded && (
                <Settings
                    active={settingsOpen}
                    settingsTabbable={settingsOpen}
                    closeSettings={closeSettings}
                    storeSettings={storeSettings}
                    confirmActive={confirmOpen}
                    confirmTabbable={confirmOpen}
                    openConfirm={openConfirm}
                    closeConfirm={closeConfirm}
                    logoutClick={logoutClick}
                    sensorState={sensorState}
                    unitState={unitState}
                    highState={highState}
                    lowState={lowState}
                    highMMOLLState={highMMOLLState}
                    lowMMOLLState={lowMMOLLState}
                    setSensorState={setSensorState}
                    setUnitState={setUnitState}
                    setHighState={setHighState}
                    setLowState={setLowState}
                    setHighMMOLLState={setHighMMOLLState}
                    setLowMMOLLState={setLowMMOLLState}></Settings>
            )}

            <motion.div
                id="pythonError"
                variants={variants}
                animate={pythonError ? "visible" : "hidden"}
                transition={{
                    duration: 0.05,
                    opacity: {
                        duration: 0.2,
                    },
                }}
                className="w-max absolute rounded-lg bg-dex-bg drop-shadow-2xl opacity-0 left-1/2 top-1/2 p-6 z-30">
                <div className="text-nowrap mb-1 text-lg font-semibold text-dex-text">
                    Dexcom process error
                </div>
                <div className="mb-6 text-sm font-normal text-dex-text-muted">
                    You may need to restart Dexcom Desktop Application
                </div>
                <div className="flex justify-end gap-2">
                    <Button
                        className="text-sm py-2 pl-3.5 pr-[14.25px] bg-dex-bg hover:bg-dex-bg text-dex-text-muted hover:text-dex-text "
                        text="Ok"
                        tabbable={pythonError}
                        click={() => {
                            closePythonError();
                        }}></Button>
                    <Button
                        className="focus-visible:outline-dex-green outline-transparent text-sm py-2 pl-3.5 pr-[14.25px]"
                        text="Restart"
                        tabbable={pythonError}
                        click={() => {
                            closePythonError();
                            restartApp();
                        }}></Button>
                </div>
            </motion.div>
        </StrictMode>
    );
};

export default App;
