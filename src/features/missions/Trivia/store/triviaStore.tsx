import React, {
  createContext,
  useContext,
  useState,
} from 'react';

import { DEFAULT_TRIVIA_CONFIG } from '../constants/trivia.config';
import { TriviaConfig } from '../types/trivia.types';

interface TriviaContextType {
  config: TriviaConfig;
  setConfig: (config: TriviaConfig) => void;
}

const TriviaContext = createContext<TriviaContextType>({
  config: DEFAULT_TRIVIA_CONFIG,
  setConfig: () => {},
});

export function TriviaProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<TriviaConfig>(
    DEFAULT_TRIVIA_CONFIG,
  );

  return (
    <TriviaContext.Provider value={{ config, setConfig }}>
      {children}
    </TriviaContext.Provider>
  );
}

export function useTriviaStore() {
  return useContext(TriviaContext);
}
