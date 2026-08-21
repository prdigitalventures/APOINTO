'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

export interface OwnerBusiness {
  id: string;
  name: string;
  slug: string;
  category: string;
  location: string | null;
  description: string | null;
  about: string | null;
  logo: string | null;
  uniqueCode: string | null;
  contactPhone: string | null;
  _count?: { bookings: number };
}

const STORAGE_KEY = 'apointo-active-business';

interface Ctx {
  businesses: OwnerBusiness[];
  active: OwnerBusiness | null;
  setActiveId: (id: string) => void;
  refresh: () => Promise<void>;
  loaded: boolean;
}

const ActiveBusinessContext = createContext<Ctx | null>(null);

export function ActiveBusinessProvider({ children }: { children: ReactNode }) {
  const [businesses, setBusinesses] = useState<OwnerBusiness[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/businesses');
    if (!res.ok) {
      setLoaded(true);
      return;
    }
    const data = await res.json();
    const list = (data.businesses || []) as OwnerBusiness[];
    setBusinesses(list);
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const next = list.find((b) => b.id === stored)?.id || list[0]?.id || null;
    setActiveIdState(next);
    if (next) window.localStorage.setItem(STORAGE_KEY, next);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setActiveId = (id: string) => {
    setActiveIdState(id);
    window.localStorage.setItem(STORAGE_KEY, id);
  };

  const active = businesses.find((b) => b.id === activeId) || businesses[0] || null;

  return (
    <ActiveBusinessContext.Provider value={{ businesses, active, setActiveId, refresh, loaded }}>
      {children}
    </ActiveBusinessContext.Provider>
  );
}

export function useActiveBusiness() {
  const ctx = useContext(ActiveBusinessContext);
  if (!ctx) throw new Error('useActiveBusiness must be used within ActiveBusinessProvider');
  return ctx;
}
