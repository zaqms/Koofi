"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LIVE_CITY,
  isComingSoonCity,
  isLiveCity,
  parseCityId,
  type CityId,
} from "./cities";
import type { City } from "./types";

const LIVE_STORAGE_KEY = "wain.city";
const COMING_SOON_SESSION_KEY = "wain.city.comingSoon";

export type CityContextValue = {
  cityId: CityId;
  liveCity: City;
  isLive: boolean;
  isComingSoon: boolean;
  selectCity: (id: CityId) => void;
};

const CityContext = createContext<CityContextValue | null>(null);

function readStoredLiveCity(): City | null {
  try {
    const raw = window.localStorage.getItem(LIVE_STORAGE_KEY);
    const id = parseCityId(raw);
    return id && isLiveCity(id) ? id : null;
  } catch {
    return null;
  }
}

function readSessionComingSoon(): CityId | null {
  try {
    const raw = window.sessionStorage.getItem(COMING_SOON_SESSION_KEY);
    const id = parseCityId(raw);
    return id && isComingSoonCity(id) ? id : null;
  } catch {
    return null;
  }
}

function writeLiveCity(id: City) {
  try {
    window.localStorage.setItem(LIVE_STORAGE_KEY, id);
    window.sessionStorage.removeItem(COMING_SOON_SESSION_KEY);
  } catch {
    // private mode
  }
}

function writeComingSoon(id: CityId) {
  try {
    window.sessionStorage.setItem(COMING_SOON_SESSION_KEY, id);
  } catch {
    // private mode
  }
}

const DEFAULT_VALUE: CityContextValue = {
  cityId: DEFAULT_LIVE_CITY,
  liveCity: DEFAULT_LIVE_CITY,
  isLive: true,
  isComingSoon: false,
  selectCity: () => undefined,
};

export function CityProvider({ children }: { children: ReactNode }) {
  const [cityId, setCityId] = useState<CityId>(DEFAULT_LIVE_CITY);

  useEffect(() => {
    const comingSoon = readSessionComingSoon();
    if (comingSoon) {
      setCityId(comingSoon);
      return;
    }
    const live = readStoredLiveCity();
    if (live) setCityId(live);
  }, []);

  const selectCity = useCallback((id: CityId) => {
    setCityId(id);
    if (isLiveCity(id)) {
      writeLiveCity(id);
      return;
    }
    writeComingSoon(id);
  }, []);

  const value = useMemo<CityContextValue>(() => {
    const live = isLiveCity(cityId);
    return {
      cityId,
      liveCity: DEFAULT_LIVE_CITY,
      isLive: live,
      isComingSoon: !live,
      selectCity,
    };
  }, [cityId, selectCity]);

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity(): CityContextValue {
  return useContext(CityContext) ?? DEFAULT_VALUE;
}
