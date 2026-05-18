import React, { createContext, useContext, useState } from 'react';
import { ColoredFiguresConfig } from '../types/ColoredFigures.types';
import { DEFAULT_CONFIG } from '../constants/ColoredFigure.config';

interface ColoredFiguresContextType {
  config: ColoredFiguresConfig;
  setConfig: (config: ColoredFiguresConfig) => void;
}

const ColoredFiguresContext = createContext<ColoredFiguresContextType>({
  config: DEFAULT_CONFIG,
  setConfig: () => {},
});

export function ColoredFiguresProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ColoredFiguresConfig>(DEFAULT_CONFIG);
  return (
    <ColoredFiguresContext.Provider value={{ config, setConfig }}>
      {children}
    </ColoredFiguresContext.Provider>
  );
}

export function useColoredFiguresStore() {
  return useContext(ColoredFiguresContext);
}