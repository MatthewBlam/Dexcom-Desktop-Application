import { useState, useCallback } from "react";
import { useSettingsContext } from "../contexts/SettingsContext";
import { Settings, DEFAULT_SETTINGS } from "../shared/types";

export function useSettingsManager() {
  const { settings: committed, setSettings: setCommitted } =
    useSettingsContext();
  const [draft, setDraft] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  const applySettings = useCallback(
    (s: Settings) => {
      setCommitted(s);
    },
    [setCommitted],
  );

  const openDraft = useCallback(async () => {
    try {
      const s = await window.api.getSettings();
      setCommitted(s);
      setDraft(s);
    } catch {
    }
  }, [setCommitted]);

  const saveDraft = useCallback(() => {
    window.api.saveSettings(draft).catch(() => {});
    setCommitted(draft);
  }, [draft, setCommitted]);

  const resetDraft = useCallback(() => {
    setDraft({ ...DEFAULT_SETTINGS });
  }, []);

  const updateDraft = useCallback((partial: Partial<Settings>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  return {
    committed,
    draft,
    isLoaded,
    setIsLoaded,
    applySettings,
    openDraft,
    saveDraft,
    resetDraft,
    updateDraft,
  };
}
