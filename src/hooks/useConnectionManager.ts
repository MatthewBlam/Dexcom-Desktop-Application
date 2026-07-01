import { useState, useEffect, useRef } from "react";
import { Reading, ConnectionStatus, DEFAULT_READING } from "../shared/types";
import { useHistoryContext } from "../contexts/HistoryContext";
import { parseReadingDateTime } from "../shared/reading-utils";

const STALE_THRESHOLD_MS = 10 * 60 * 1000;
const STALE_CHECK_INTERVAL_MS = 60 * 1000;

export function useConnectionManager() {
  const [currentReading, setCurrentReading] =
    useState<Reading>(DEFAULT_READING);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [isStale, setIsStale] = useState(false);
  const { setHistoryItems } = useHistoryContext();
  const readingRef = useRef(currentReading);
  readingRef.current = currentReading;

  useEffect(() => {
    const unsubs = [
      window.api.onReading((newReading: Reading) => {
        setCurrentReading(newReading);
        setIsStale(false);
        setHistoryItems((prev: Reading[]) =>
          [newReading].concat(prev).slice(0, 300),
        );
        window.api.saveReading(newReading).catch(() => {});
      }),
      window.api.onConnectionStatus((status: ConnectionStatus) => {
        setConnectionStatus(status);
      }),
      window.api.onHistoryBackfill((readings: Reading[]) => {
        setHistoryItems(
          [...readings].sort((a, b) => {
            const aDate = parseReadingDateTime(a.date_time);
            const bDate = parseReadingDateTime(b.date_time);
            if (!aDate || !bDate) return 0;
            return bDate.getTime() - aDate.getTime();
          }),
        );
      }),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [setHistoryItems]);

  useEffect(() => {
    function checkStaleness() {
      const reading = readingRef.current;
      if (reading.value === -1) return;
      const parsed = parseReadingDateTime(reading.date_time);
      if (!parsed) return;
      setIsStale(Date.now() - parsed.getTime() > STALE_THRESHOLD_MS);
    }

    const timer = setInterval(checkStaleness, STALE_CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return {
    currentReading,
    connectionStatus,
    isStale,
  };
}
