import React, { createContext, useContext, useState } from 'react';
import { DEFAULT_CONFIG } from '../constants/paresMission.config';
import { PairsMissionConfig } from '../types/paresMission.types';

interface PairsMissionContextType {
  config: PairsMissionConfig;
  setConfig: (config: PairsMissionConfig) => void;
}

const PairsMissionContext = createContext<PairsMissionContextType>({
  config: DEFAULT_CONFIG,
  setConfig: () => {},
});

// Mantiene la configuracion actual de encontrar pares
export function PairsMissionProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<PairsMissionConfig>(DEFAULT_CONFIG);

  return (
    <PairsMissionContext.Provider value={{ config, setConfig }}>
      {children}
    </PairsMissionContext.Provider>
  );
}

// Acceso rapido al contexto de encontrar pares
export function usePairsMissionStore() {
  return useContext(PairsMissionContext);
}
