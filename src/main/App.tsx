import { StrictMode, useEffect, useState, useRef } from "react";
import { useSettingsContext } from "../contexts/SettingsContext";
import { useHistoryContext } from "../contexts/HistoryContext";
import { DraggableTopBar } from "../components/DraggableTopBar";
import { Dimmer, DimmerFlashing } from "../components/Dimmer";
import { RootLayout } from "../components/RootLayout";
import { ErrorToast } from "../components/ErrorToast";
import { Settings } from "../components/Settings";
import { Button } from "../components/Button";
import { motion, useAnimate } from "motion/react";
import { twMerge } from "tailwind-merge";
import { Display } from "./Display";
import { Login } from "./Login";
import "inter-ui/inter.css";
import clsx from "clsx";
import { Reading, Settings as SettingsType, DEFAULT_READING } from "../shared/types";

const variants = {
    hidden: { opacity: 0, scale: 0, x: "-50%", y: "-50%" },
    visible: { opacity: 1, scale: 1, x: "-50%", y: "-50%" },
};

const App = () => {
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

    const G7theme = sensorSetting === "G7";

    useEffect(() => {
        document.body.style.backgroundColor = G7theme ? "#e6e6e6" : "#ffffff";
    }, [G7theme]);

    const [sensorState, setSensorState] = useState<string | null>(null);
    const [unitState, setUnitState] = useState<string | null>(null);
    const [highState, setHighState] = useState<number | null>(null);
    const [lowState, setLowState] = useState<number | null>(null);
    const [highMMOLLState, setHighMMOLLState] = useState<number | null>(null);
    const [lowMMOLLState, setLowMMOLLState] = useState<number | null>(null);
    const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

    async function openSettings() {
        const settings = await window.api.getSettings();
        applySettings(settings);
        setDimmerOn(true);
        setSettingsOpen(true);
    }

    function closeSettings() {
        setDimmerOn(false);
        setSettingsOpen(false);
    }

    function applySettings(settings: SettingsType) {
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

    function storeSettings(settings: SettingsType) {
        window.api.saveSettings(settings);
        applySettings(settings);
    }

    function toggleWidget() {
        if (!widgetOpen) {
            window.api.openWidget(null);
            setWidgetOpen(true);
        } else {
            window.api.closeWidget();
            setWidgetOpen(false);
        }
    }

    function trayOpenWidget() {
        window.api.openWidget("NOFOCUS");
        setWidgetOpen(true);
    }

    function trayCloseWidget() {
        window.api.closeWidget();
        setWidgetOpen(false);
    }

    const hasPageRendered = useRef(false);
    useEffect(() => {
        if (!hasPageRendered.current) {
            hasPageRendered.current = true;
            return;
        }
        window.api.saveWidgetOpenState(widgetOpen);
    }, [widgetOpen]);

    const [LOADED, setLOADED] = useState<boolean>(false);
    const [CREDENTIALS, setCREDENTIALS] = useState<boolean | undefined>(false);

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
        if (userVal === "" || passwordVal === "") {
            setErrorText("Please provide both email and password");
            setErrorActive(true);
            setCREDENTIALS(undefined);
            setDisableForm(false);
            return;
        }
        setErrorActive(false);
        setDisableForm(true);
        window.api.login({ user: userVal, password: passwordVal, ous: ousChecked });
    };

    const logoutClick = () => {
        window.api.logout();
        if (widgetOpen) {
            toggleWidget();
        }
        window.api.saveWidgetOpenState(false);
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

    useEffect(() => {
        if (!loginOpen && !displayOpen) {
            console.log("FLASHING ON");
            setDimmerFlashingOn(true);
        } else {
            setDimmerFlashingOn(false);
        }
    }, [loginOpen, displayOpen]);

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
        setDimmerFlashingOn(false);
        window.api.resetTray();
    }

    function openDisplayPage() {
        displayAnimate(
            displayScope.current,
            { x: "-50%" },
            { type: "tween", ease: "easeInOut" }
        );
        closeLoginPage();
        setDisplayOpen(true);
        window.api.getWidgetOpenState().then((open) => {
            if (open && !widgetOpen) {
                toggleWidget();
            }
            window.api.setTrayWidgetState(open);
        });
        setDimmerFlashingOn(false);
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

    const [currentReading, setCurrentReading] = useState<Reading>(DEFAULT_READING);
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
        window.api.restart();
    }

    useEffect(() => {
        setDimmerFlashingOn(false);
        closeLoginPage();
        closeDisplayPage();

        // Initialize: get settings and trigger stored credential login
        window.api.domReady().then(({ settings, hasCredentials }) => {
            applySettings(settings);
            setIsSettingsLoaded(true);
            if (!hasCredentials) {
                setLOADED(true);
                openLoginPage();
            }
        }).catch((err) => {
            console.error("domReady failed:", err);
            setLOADED(true);
            openLoginPage();
        });

        // Subscribe to push events
        const unsubs = [
            window.api.onLog((messages) => {
                console.log(...messages);
            }),
            window.api.onPythonError(() => {
                setLOADED(true);
                openPythonError();
            }),
            window.api.onAuthError((error) => {
                setLOADED(true);
                if (error) {
                    setErrorText(error);
                    setErrorActive(true);
                }
                setCREDENTIALS(undefined);
                setUserVal("");
                setPasswordVal("");
                setDisableForm(false);
                openLoginPage();
            }),
            window.api.onAuthSuccess(() => {
                setLOADED(true);
                setCREDENTIALS(true);
                openDisplayPage();
                sessionStorage.setItem("session", "true");
            }),
            window.api.onPythonKilled(() => {
                setDimmerFlashingOn(false);
                openLoginPage();
            }),
            window.api.onCloseWidget(() => {
                setWidgetOpen(false);
            }),
            window.api.onTrayOpenWidget(() => {
                trayOpenWidget();
            }),
            window.api.onTrayCloseWidget(() => {
                trayCloseWidget();
            }),
            window.api.onReading((newReading) => {
                console.log("Received Reading:", newReading);
                setCurrentReading(newReading);
                setHistoryItems((prev: Reading[]) =>
                    [newReading].concat(prev)
                );
                window.api.saveReading(newReading);
            }),
        ];

        return () => { unsubs.forEach((fn) => fn()); };
    }, []);

    const keyID = String(new Date().getTime());

    return (
        <StrictMode>
            <DraggableTopBar></DraggableTopBar>
            <RootLayout
                duration={1}
                delay={0.5}
                animate={LOADED ? { opacity: 1 } : { opacity: 0 }}
                className={twMerge(
                    "mt-10 w-full",
                    G7theme ? "bg-dex-fg" : "bg-dex-bg",
                )}>
                <motion.div
                    ref={loginScope}
                    initial={{ x: "-200%" }}
                    className={twMerge(
                        "absolute left-1/2 w-full h-full flex justify-center items-center",
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
                            CREDENTIALS ||
                            settingsOpen ||
                            confirmOpen ||
                            pythonError
                                ? false
                                : true
                        }></Login>
                </motion.div>

                <motion.div
                    ref={displayScope}
                    initial={{ x: "200%" }}
                    className={twMerge(
                        "absolute left-1/2 w-full h-full flex flex-col justify-center items-center",
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
                            !CREDENTIALS ||
                            settingsOpen ||
                            confirmOpen ||
                            pythonError
                                ? false
                                : true
                        }></Display>
                </motion.div>

                <ErrorToast
                    className="absolute left-1/2 bottom-[-384px] max-w-[90%]"
                    active={errorActive}
                    text={errorText}
                    close={() => {
                        setErrorActive(false);
                    }}></ErrorToast>
            </RootLayout>

            <Dimmer active={dimmerOn}></Dimmer>
            {!loginOpen && !displayOpen && (
                <DimmerFlashing
                    show={dimmerFlashingOn}
                    keyID={keyID}
                    active={dimmerFlashingOn}></DimmerFlashing>
            )}

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
                initial="hidden"
                animate={pythonError ? "visible" : "hidden"}
                transition={{
                    duration: 0.05,
                    opacity: {
                        duration: 0.2,
                    },
                }}
                className="w-max absolute rounded-lg bg-dex-bg drop-shadow-2xl left-1/2 top-1/2 p-6 z-30">
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
