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
import { Reading, Settings as SettingsType, DEFAULT_READING, ConnectionStatus } from "../shared/types";
import { parseReadingDateTime } from "../shared/reading-utils";

const variants = {
  hidden: { opacity: 0, x: "-50%", y: "-50%" },
  visible: { opacity: 1, x: "-50%", y: "-50%" },
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
    criticalLowSetting,
    setCriticalLowSetting,
    criticalLowSettingMMOLL,
    setCriticalLowSettingMMOLL,
    launchAtLoginSetting,
    setLaunchAtLoginSetting,
    widgetOpacitySetting,
    setWidgetOpacitySetting,
    widgetShowIndicatorSetting,
    setWidgetShowIndicatorSetting,
    widgetShowSparklineSetting,
    setWidgetShowSparklineSetting,
    widgetOpen,
    setWidgetOpen,
  } = useSettingsContext();

  useEffect(() => {
    document.body.style.backgroundColor = "var(--color-dex-fg)";
  }, []);

  const [sensorState, setSensorState] = useState<string | null>(null);
  const [unitState, setUnitState] = useState<string | null>(null);
  const [highState, setHighState] = useState<number | null>(null);
  const [lowState, setLowState] = useState<number | null>(null);
  const [highMMOLLState, setHighMMOLLState] = useState<number | null>(null);
  const [lowMMOLLState, setLowMMOLLState] = useState<number | null>(null);
  const [criticalLowState, setCriticalLowState] = useState<number | null>(null);
  const [criticalLowMMOLLState, setCriticalLowMMOLLState] = useState<number | null>(null);
  const [launchAtLoginState, setLaunchAtLoginState] = useState<boolean>(false);
  const [widgetOpacityState, setWidgetOpacityState] = useState<number>(1.0);
  const [widgetShowIndicatorState, setWidgetShowIndicatorState] = useState<boolean>(true);
  const [widgetShowSparklineState, setWidgetShowSparklineState] = useState<boolean>(true);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  async function openSettings() {
    try {
      const settings = await window.api.getSettings();
      applySettings(settings);
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
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
    setCriticalLowSetting(settings.criticalLow);
    setCriticalLowSettingMMOLL(settings.criticalLowMMOLL);
    setLaunchAtLoginSetting(settings.launchAtLogin);
    setWidgetOpacitySetting(settings.widgetOpacity);
    setWidgetShowIndicatorSetting(settings.widgetShowIndicator);
    setWidgetShowSparklineSetting(settings.widgetShowSparkline);

    setSensorState(settings.sensor);
    setUnitState(settings.unit);
    setHighState(settings.high);
    setLowState(settings.low);
    setHighMMOLLState(settings.highMMOLL);
    setLowMMOLLState(settings.lowMMOLL);
    setCriticalLowState(settings.criticalLow);
    setCriticalLowMMOLLState(settings.criticalLowMMOLL);
    setLaunchAtLoginState(settings.launchAtLogin);
    setWidgetOpacityState(settings.widgetOpacity);
    setWidgetShowIndicatorState(settings.widgetShowIndicator);
    setWidgetShowSparklineState(settings.widgetShowSparkline);
  }

  function storeSettings(settings: SettingsType) {
    window.api.saveSettings(settings).catch((err: unknown) => {
      console.error("Failed to save settings:", err);
    });
    applySettings(settings);
  }

  function toggleWidget() {
    if (!widgetOpen) {
      window.api.openWidget(null).catch(() => {});
      setWidgetOpen(true);
    } else {
      window.api.closeWidget().catch(() => {});
      setWidgetOpen(false);
    }
  }

  function trayOpenWidget() {
    window.api.openWidget("NOFOCUS").catch(() => {});
    setWidgetOpen(true);
  }

  function trayCloseWidget() {
    window.api.closeWidget().catch(() => {});
    setWidgetOpen(false);
  }

  const hasPageRendered = useRef(false);
  useEffect(() => {
    if (!hasPageRendered.current) {
      hasPageRendered.current = true;
      return;
    }
    window.api.saveWidgetOpenState(widgetOpen).catch(() => {});
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
    window.api.login({ user: userVal, password: passwordVal, ous: ousChecked }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      setErrorText(message || "Login failed");
      setErrorActive(true);
      setCREDENTIALS(undefined);
      setDisableForm(false);
    });
  };

  const logoutClick = () => {
    window.api.logout().catch((err: unknown) => {
      console.error("Logout error:", err);
    });
    if (widgetOpen) {
      toggleWidget();
    }
    window.api.saveWidgetOpenState(false).catch(() => {});
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
    loginAnimate(loginScope.current, { x: "-200%" }, { type: "tween", ease: "easeInOut" });
    setLoginOpen(false);
  }

  function closeDisplayPage() {
    if (widgetOpen) {
      toggleWidget();
    }
    displayAnimate(displayScope.current, { x: "200%" }, { type: "tween", ease: "easeInOut" });
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
    loginAnimate(loginScope.current, { x: "-50%" }, { type: "tween", ease: "easeInOut" });
    closeDisplayPage();
    setLoginOpen(true);
    setDimmerFlashingOn(false);
    window.api.resetTray().catch(() => {});
  }

  function openDisplayPage() {
    displayAnimate(displayScope.current, { x: "-50%" }, { type: "tween", ease: "easeInOut" });
    closeLoginPage();
    setDisplayOpen(true);
    window.api
      .getWidgetOpenState()
      .then((open) => {
        if (open && !widgetOpen) {
          toggleWidget();
        }
        window.api.setTrayWidgetState(open).catch(() => {});
      })
      .catch(() => {});
    setDimmerFlashingOn(false);
  }

  const [historyExpanded, setHistoryExpanded] = useState(false);

  function toggleHistoryExpanded() {
    setHistoryExpanded((prev) => {
      const next = !prev;
      setDimmerOn(next);
      return next;
    });
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
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
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
    window.api
      .domReady()
      .then(({ settings, hasCredentials }) => {
        applySettings(settings);
        setIsSettingsLoaded(true);
        if (!hasCredentials) {
          setLOADED(true);
          openLoginPage();
        }
      })
      .catch((err) => {
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
        setHistoryItems((prev: Reading[]) => [newReading].concat(prev).slice(0, 300));
        window.api.saveReading(newReading).catch(() => {});
      }),
      window.api.onConnectionStatus((status: ConnectionStatus) => {
        setConnectionStatus(status);
      }),
      window.api.onHistoryBackfill((readings: Reading[]) => {
        setHistoryItems(
          [...readings].sort((a, b) => {
            const aDate = parseReadingDateTime(a.date_time as [string, string]);
            const bDate = parseReadingDateTime(b.date_time as [string, string]);
            if (!aDate || !bDate) return 0;
            return bDate.getTime() - aDate.getTime();
          }),
        );
      }),
    ];

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, []);

  const keyID = String(new Date().getTime());

  return (
    <StrictMode>
      <DraggableTopBar></DraggableTopBar>
      <RootLayout duration={1} delay={0.5} animate={LOADED ? { opacity: 1 } : { opacity: 0 }} className={twMerge("pt-10 w-full", "bg-dex-fg")}>
        <motion.div ref={loginScope} initial={{ x: "-200%" }} className={twMerge("absolute left-1/2 w-full h-full flex justify-center items-center", clsx({ "pointer-events-none": CREDENTIALS }))}>
          <Login
            userVal={userVal}
            passwordVal={passwordVal}
            ousChecked={ousChecked}
            userChange={userChange}
            ousChange={ousChange}
            passwordChange={passwordChange}
            loginClick={loginClick}
            disabled={disableForm}
            tabbable={CREDENTIALS || settingsOpen || confirmOpen || pythonError ? false : true}></Login>
        </motion.div>

        <motion.div
          ref={displayScope}
          initial={{ x: "200%" }}
          className={twMerge(
            "absolute left-1/2 w-full h-[calc(100%-3rem)] flex flex-col justify-center items-center",
            clsx({
              "pointer-events-none": !CREDENTIALS,
            }),
          )}>
          <Display
            reading={currentReading}
            connectionStatus={connectionStatus}
            openSettings={openSettings}
            toggleWidget={toggleWidget}
            widgetOpen={widgetOpen}
            historyExpanded={historyExpanded}
            onToggleHistoryExpanded={toggleHistoryExpanded}
            tabbable={!CREDENTIALS || settingsOpen || confirmOpen || pythonError || historyExpanded ? false : true}></Display>
        </motion.div>

        <ErrorToast
          className="absolute left-1/2 bottom-[-384px] max-w-[90%]"
          active={errorActive}
          text={errorText}
          close={() => {
            setErrorActive(false);
          }}></ErrorToast>
      </RootLayout>

      <Dimmer
        active={dimmerOn}
        onClick={() => {
          if (confirmOpen || pythonError) return;
          if (settingsOpen) closeSettings();
          if (historyExpanded) setHistoryExpanded(false);
          setDimmerOn(false);
        }}></Dimmer>
      {!loginOpen && !displayOpen && <DimmerFlashing show={dimmerFlashingOn} keyID={keyID} active={dimmerFlashingOn}></DimmerFlashing>}

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
          criticalLowState={criticalLowState}
          criticalLowMMOLLState={criticalLowMMOLLState}
          launchAtLoginState={launchAtLoginState}
          setSensorState={setSensorState}
          setUnitState={setUnitState}
          setHighState={setHighState}
          setLowState={setLowState}
          setHighMMOLLState={setHighMMOLLState}
          setLowMMOLLState={setLowMMOLLState}
          setCriticalLowState={setCriticalLowState}
          setCriticalLowMMOLLState={setCriticalLowMMOLLState}
          setLaunchAtLoginState={setLaunchAtLoginState}
          widgetOpacityState={widgetOpacityState}
          setWidgetOpacityState={setWidgetOpacityState}
          widgetShowIndicatorState={widgetShowIndicatorState}
          setWidgetShowIndicatorState={setWidgetShowIndicatorState}
          widgetShowSparklineState={widgetShowSparklineState}
          setWidgetShowSparklineState={setWidgetShowSparklineState}></Settings>
      )}

      <motion.div
        id="pythonError"
        variants={variants}
        initial="hidden"
        animate={pythonError ? "visible" : "hidden"}
        transition={{ duration: 0.2 }}
        className={`w-max absolute rounded-lg bg-dex-bg drop-shadow-2xl left-1/2 top-1/2 p-6 z-30 ${pythonError ? "" : "pointer-events-none"}`}>
        <div className="text-nowrap mb-1 text-lg font-semibold text-dex-text">Dexcom process error</div>
        <div className="mb-6 text-sm font-normal text-dex-text-muted">You may need to restart Dexcom Desktop Application</div>
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
