import React, { createContext, useContext, useEffect, useState } from 'react';

type Ctx = { enabled: boolean; setEnabled: (v: boolean) => void; toggle: () => void; };
const SoundSettingsContext = createContext<Ctx | null>(null);

export function SoundSettingsProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState<boolean>(() => {
    const raw = localStorage.getItem('soundEnabled');
    return raw ? raw === 'true' : true;
  });
  useEffect(() => { localStorage.setItem('soundEnabled', String(enabled)); }, [enabled]);
  const toggle = () => setEnabled(v => !v);
  return (
    <SoundSettingsContext.Provider value={{ enabled, setEnabled, toggle }}>
      {children}
    </SoundSettingsContext.Provider>
  );
}

export function useSoundSettings() {
  const ctx = useContext(SoundSettingsContext);
  if (!ctx) throw new Error('useSoundSettings must be used within SoundSettingsProvider');
  return ctx;
}