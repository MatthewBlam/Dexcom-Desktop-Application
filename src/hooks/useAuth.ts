import { useState, useCallback } from "react";

export function useAuth() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasCredentials, setHasCredentials] = useState<boolean | undefined>(
    false,
  );
  const [userVal, setUserVal] = useState("");
  const [passwordVal, setPasswordVal] = useState("");
  const [regionVal, setRegionVal] = useState("us");
  const [disableForm, setDisableForm] = useState(false);
  const [errorText, setErrorText] = useState("Error");
  const [errorActive, setErrorActive] = useState(false);

  const userChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setUserVal(event.target.value);
    },
    [],
  );

  const passwordChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPasswordVal(event.target.value);
    },
    [],
  );

  const regionChange = useCallback((region: string) => {
    setRegionVal(region);
  }, []);

  const login = useCallback(() => {
    if (userVal === "" || passwordVal === "") {
      setErrorText("Please provide both email and password");
      setErrorActive(true);
      setHasCredentials(undefined);
      setDisableForm(false);
      return;
    }
    setErrorActive(false);
    setDisableForm(true);
    window.api
      .login({ user: userVal, password: passwordVal, region: regionVal as "us" | "ous" | "jp" })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setErrorText(message || "Login failed");
        setErrorActive(true);
        setHasCredentials(undefined);
        setDisableForm(false);
      });
  }, [userVal, passwordVal, regionVal]);

  const handleAuthSuccess = useCallback(() => {
    setIsLoaded(true);
    setHasCredentials(true);
  }, []);

  const handleAuthError = useCallback((error?: string | null) => {
    setIsLoaded(true);
    if (error) {
      setErrorText(error);
      setErrorActive(true);
    }
    setHasCredentials(undefined);
    setUserVal("");
    setPasswordVal("");
    setDisableForm(false);
  }, []);

  const handleLogout = useCallback(() => {
    window.api.logout().catch(() => {});
    window.api.saveWidgetOpenState(false).catch(() => {});
    setErrorActive(false);
    setDisableForm(false);
    setHasCredentials(false);
    sessionStorage.clear();
  }, []);

  const resetForm = useCallback(() => {
    setUserVal("");
    setPasswordVal("");
    setRegionVal("us");
  }, []);

  return {
    isLoaded,
    setIsLoaded,
    hasCredentials,
    setHasCredentials,
    userVal,
    passwordVal,
    regionVal,
    disableForm,
    errorText,
    errorActive,
    setErrorActive,
    userChange,
    passwordChange,
    regionChange,
    login,
    handleAuthSuccess,
    handleAuthError,
    handleLogout,
    resetForm,
  };
}
