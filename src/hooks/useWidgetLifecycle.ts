import { useState, useCallback, useEffect, useRef } from "react";

export function useWidgetLifecycle() {
  const [widgetOpen, setWidgetOpen] = useState(false);
  const widgetOpenRef = useRef(false);
  widgetOpenRef.current = widgetOpen;

  const hasRendered = useRef(false);
  useEffect(() => {
    if (!hasRendered.current) {
      hasRendered.current = true;
      return;
    }
    window.api.saveWidgetOpenState(widgetOpen).catch(() => {});
  }, [widgetOpen]);

  const toggleWidget = useCallback(() => {
    if (!widgetOpenRef.current) {
      window.api.openWidget(null).catch(() => {});
      setWidgetOpen(true);
    } else {
      window.api.closeWidget().catch(() => {});
      setWidgetOpen(false);
    }
  }, []);

  const closeWidget = useCallback(() => {
    if (widgetOpenRef.current) {
      window.api.closeWidget().catch(() => {});
      setWidgetOpen(false);
    }
  }, []);

  const trayOpenWidget = useCallback(() => {
    window.api.openWidget("NOFOCUS").catch(() => {});
    setWidgetOpen(true);
  }, []);

  const trayCloseWidget = useCallback(() => {
    window.api.closeWidget().catch(() => {});
    setWidgetOpen(false);
  }, []);

  useEffect(() => {
    const unsubs = [
      window.api.onCloseWidget(() => {
        setWidgetOpen(false);
      }),
      window.api.onTrayOpenWidget(() => {
        trayOpenWidget();
      }),
      window.api.onTrayCloseWidget(() => {
        trayCloseWidget();
      }),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [trayOpenWidget, trayCloseWidget]);

  return {
    widgetOpen,
    setWidgetOpen,
    toggleWidget,
    closeWidget,
  };
}
