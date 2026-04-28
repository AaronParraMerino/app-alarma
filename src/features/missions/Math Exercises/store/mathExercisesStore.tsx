import React, { createContext, useContext, useState } from 'react';
import { MathExercisesConfig } from '../types/mathExercises.types';
import { DEFAULT_CONFIG } from '../constants/mathExercises.config';

interface MathExercisesContextType {
  config: MathExercisesConfig;
  setConfig: (config: MathExercisesConfig) => void;
}

const MathExercisesContext = createContext<MathExercisesContextType>({
  config: DEFAULT_CONFIG,
  setConfig: () => {},
});

export function MathExercisesProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<MathExercisesConfig>(DEFAULT_CONFIG);
  return (
    <MathExercisesContext.Provider value={{ config, setConfig }}>
      {children}
    </MathExercisesContext.Provider>
  );
}

export function useMathExercisesStore() {
  return useContext(MathExercisesContext);
}
