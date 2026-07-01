import { StrictMode, useCallback, useEffect, useState, useRef } from "react";
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
import { useSettingsManager } from "../hooks/useSettingsManager";
import { useAuth } from "../hooks/useAuth";
import { useWidgetLifecycle } from "../hooks/useWidgetLifecycle";
import { useConnectionManager } from "../hooks/useConnectionManager";

const variants = {
  hidden: { opacity: 0, x: "-50%", y: "-50%" },
  visible: { opacity: 1, x: "-50%", y: "-50%" },
};

const App = () => {
  const settingsManager = useSettingsManager();
  const auth = useAuth();
  const widget = useWidgetLifecycle();
  const connection = useConnectionManager();

  useEffect(() => {
    document.body.style.backgroundColor = "var(--color-dex-fg)";
  }, []);

  // --- UI overlay state ---
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dimmerOn, setDimmerOn] = useState(false);
  const [dimmerFlashingOn, setDimmerFlashingOn] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pythonError, setPythonError] = useState(false);

  // --- Page animation ---
  const [loginOpen, setLoginOpen] = useState(true);
  const [loginScope, loginAnimate] = useAnimate();
  const [displayOpen, setDisplayOpen] = useState(true);
  const [displayScope, displayAnimate] = useAnimate();

  useEffect(() => {
    if (!loginOpen && !displayOpen) {
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
    widget.closeWidget();
    displayAnimate(displayScope.current, { x: "200%" }, { type: "tween", ease: "easeInOut" });
    setDisplayOpen(false);
  }

  function openLoginPage() {
    widget.closeWidget();
    setDimmerOn(false);
    auth.resetForm();
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
        if (open && !widget.widgetOpen) {
          widget.toggleWidget();
        }
        window.api.setTrayWidgetState(open).catch(() => {});
      })
      .catch(() => {});
    setDimmerFlashingOn(false);
  }

  // Refs so IPC callbacks always call the latest version
  const openLoginPageRef = useRef(openLoginPage);
  openLoginPageRef.current = openLoginPage;
  const openDisplayPageRef = useRef(openDisplayPage);
  openDisplayPageRef.current = openDisplayPage;

  // --- Settings dialog ---
  const handleOpenSettings = useCallback(async () => {
    await settingsManager.openDraft();
    setDimmerOn(true);
    setSettingsOpen(true);
  }, [settingsManager.openDraft]);

  const handleCloseSettings = useCallback(() => {
    setDimmerOn(false);
    setSettingsOpen(false);
  }, []);

  const handleSaveSettings = useCallback(() => {
    settingsManager.saveDraft();
    setDimmerOn(false);
    setSettingsOpen(false);
  }, [settingsManager.saveDraft]);

  // --- History ---
  const toggleHistoryExpanded = useCallback(() => {
    setHistoryExpanded((prev) => {
      const next = !prev;
      setDimmerOn(next);
      return next;
    });
  }, []);

  // --- Logout confirmation ---
  const openConfirm = useCallback(() => {
    setDimmerOn(true);
    setConfirmOpen(true);
  }, []);

  const closeConfirm = useCallback((logout = false) => {
    if (!logout) {
      setDimmerOn(false);
    }
    setConfirmOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    auth.handleLogout();
    widget.closeWidget();
    setDimmerFlashingOn(true);
  }, [auth.handleLogout, widget.closeWidget]);

  // --- Python error dialog ---
  const openPythonError = useCallback(() => {
    setDimmerOn(true);
    setPythonError(true);
  }, []);

  const closePythonError = useCallback(() => {
    setDimmerOn(false);
    setPythonError(false);
  }, []);

  // --- Initialization + IPC subscriptions ---
  useEffect(() => {
    setDimmerFlashingOn(false);
    closeLoginPage();
    closeDisplayPage();

    window.api
      .domReady()
      .then(({ settings, hasCredentials }) => {
        settingsManager.applySettings(settings);
        settingsManager.setIsLoaded(true);
        if (!hasCredentials) {
          auth.setIsLoaded(true);
          openLoginPageRef.current();
        }
      })
      .catch(() => {
        auth.setIsLoaded(true);
        openLoginPageRef.current();
      });

    const unsubs = [
      window.api.onLog((messages) => {
        console.log(...messages);
      }),
      window.api.onPythonError(() => {
        auth.setIsLoaded(true);
        openPythonError();
      }),
      window.api.onAuthError((error) => {
        auth.handleAuthError(error);
        openLoginPageRef.current();
      }),
      window.api.onAuthSuccess(() => {
        auth.handleAuthSuccess();
        openDisplayPageRef.current();
        sessionStorage.setItem("session", "true");
      }),
      window.api.onPythonKilled(() => {
        setDimmerFlashingOn(false);
        openLoginPageRef.current();
      }),
    ];

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, []);

  const keyID = useRef(String(Date.now()));

  return (
    <StrictMode>
      <DraggableTopBar></DraggableTopBar>
      <RootLayout duration={1} delay={0.5} animate={auth.isLoaded ? { opacity: 1 } : { opacity: 0 }} className={twMerge("pt-10 w-full", "bg-dex-fg")}>
        <motion.div ref={loginScope} initial={{ x: "-200%" }} className={twMerge("absolute left-1/2 w-full h-full flex justify-center items-center", clsx({ "pointer-events-none": auth.hasCredentials }))}>
          <Login
            userVal={auth.userVal}
            passwordVal={auth.passwordVal}
            regionVal={auth.regionVal}
            userChange={auth.userChange}
            regionChange={auth.regionChange}
            passwordChange={auth.passwordChange}
            loginClick={auth.login}
            disabled={auth.disableForm}
            tabbable={auth.hasCredentials || settingsOpen || confirmOpen || pythonError ? false : true}></Login>
        </motion.div>

        <motion.div
          ref={displayScope}
          initial={{ x: "200%" }}
          className={twMerge(
            "absolute left-1/2 w-full h-[calc(100%-3rem)] flex flex-col justify-center items-center",
            clsx({
              "pointer-events-none": !auth.hasCredentials,
            }),
          )}>
          <Display
            reading={connection.currentReading}
            connectionStatus={connection.connectionStatus}
            isStale={connection.isStale}
            openSettings={handleOpenSettings}
            toggleWidget={widget.toggleWidget}
            widgetOpen={widget.widgetOpen}
            historyExpanded={historyExpanded}
            onToggleHistoryExpanded={toggleHistoryExpanded}
            tabbable={!auth.hasCredentials || settingsOpen || confirmOpen || pythonError || historyExpanded ? false : true}></Display>
        </motion.div>

        <ErrorToast
          className="absolute left-1/2 bottom-[-384px] max-w-[90%]"
          active={auth.errorActive}
          text={auth.errorText}
          close={() => {
            auth.setErrorActive(false);
          }}></ErrorToast>
      </RootLayout>

      <Dimmer
        active={dimmerOn}
        onClick={() => {
          if (confirmOpen || pythonError) return;
          if (settingsOpen) handleCloseSettings();
          if (historyExpanded) setHistoryExpanded(false);
          setDimmerOn(false);
        }}></Dimmer>
      {!loginOpen && !displayOpen && <DimmerFlashing show={dimmerFlashingOn} keyID={keyID.current} active={dimmerFlashingOn}></DimmerFlashing>}

      {settingsManager.isLoaded && (
        <Settings
          active={settingsOpen}
          settingsTabbable={settingsOpen}
          draft={settingsManager.draft}
          updateDraft={settingsManager.updateDraft}
          onSave={handleSaveSettings}
          onClose={handleCloseSettings}
          onReset={settingsManager.resetDraft}
          confirmActive={confirmOpen}
          confirmTabbable={confirmOpen}
          onOpenConfirm={openConfirm}
          onCloseConfirm={closeConfirm}
          onLogout={handleLogout}></Settings>
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
              window.api.restart();
            }}></Button>
        </div>
      </motion.div>
    </StrictMode>
  );
};

export default App;
