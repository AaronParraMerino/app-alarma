import React, { createContext, useContext, useState } from 'react';
import { DEFAULT_CONFIG } from '../constants/colorFind.config';
import { ColorFindConfig } from '../types/colorFind.types';

interface ColorFindContextType {
  config: ColorFindConfig;
  setConfig: (config: ColorFindConfig) => void;
}

const ColorFindContext = createContext<ColorFindContextType>({
  config: DEFAULT_CONFIG,
  setConfig: () => {},
});

export function ColorFindProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ColorFindConfig>(DEFAULT_CONFIG);

  return (
    <ColorFindContext.Provider value={{ config, setConfig }}>
      {children}
    </ColorFindContext.Provider>
  );
}

export function useColorFindStore() {
  return useContext(ColorFindContext);
}
