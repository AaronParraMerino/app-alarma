import React, { createContext, useContext, useState } from 'react';
import { WordCompletionConfig } from '../types/wordCompletion.types';
import { DEFAULT_CONFIG } from '../constants/wordCompletion.config';

interface WordCompletionContextType {
  config: WordCompletionConfig;
  setConfig: (config: WordCompletionConfig) => void;
}

const WordCompletionContext = createContext<WordCompletionContextType>({
  config: DEFAULT_CONFIG,
  setConfig: () => {},
});

export function WordCompletionProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<WordCompletionConfig>(DEFAULT_CONFIG);
  return (
    <WordCompletionContext.Provider value={{ config, setConfig }}>
      {children}
    </WordCompletionContext.Provider>
  );
}

export function useWordCompletionStore() {
  return useContext(WordCompletionContext);
}
