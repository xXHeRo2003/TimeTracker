import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { HISTORY_STORAGE_KEY } from '../config/constants';
import { readJson, writeJson } from '../storage/storage';

const HistoryContext = createContext({
  entries: [],
  isReady: false,
  addEntry: () => undefined,
  replaceEntries: () => undefined,
  refresh: () => undefined,
  getTotalTrackedMs: () => 0
});

export const HistoryProvider = ({ children }) => {
  const [entries, setEntries] = useState([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const stored = await readJson(HISTORY_STORAGE_KEY, []);
      if (Array.isArray(stored)) {
        setEntries(stored.map((entry) => ({ ...entry })));
      }
      setIsReady(true);
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    writeJson(HISTORY_STORAGE_KEY, entries).catch((error) => {
      console.warn('[history] Unable to persist entries', error);
    });
  }, [entries, isReady]);

  const addEntry = useCallback((entry) => {
    setEntries((current) => [...current, { ...entry }]);
  }, []);

  const replaceEntries = useCallback((nextEntries) => {
    if (!Array.isArray(nextEntries)) {
      return;
    }
    setEntries(nextEntries.map((entry) => ({ ...entry })));
  }, []);

  const refresh = useCallback(async () => {
    const stored = await readJson(HISTORY_STORAGE_KEY, []);
    if (Array.isArray(stored)) {
      setEntries(stored.map((entry) => ({ ...entry })));
    }
  }, []);

  const getTotalTrackedMs = useCallback(
    () => entries.reduce((acc, entry) => acc + (entry.trackedMs || 0), 0),
    [entries]
  );

  const value = useMemo(
    () => ({
      entries,
      isReady,
      addEntry,
      replaceEntries,
      refresh,
      getTotalTrackedMs
    }),
    [entries, isReady, addEntry, replaceEntries, refresh, getTotalTrackedMs]
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
};

export const useHistoryContext = () => React.useContext(HistoryContext);

