import React, { createContext, useContext, useState } from 'react';

export interface ObjectRecognitionConfig {
  targetObjectId: string;
}

interface ObjectRecognitionContextType {
  config: ObjectRecognitionConfig;
  setConfig: (config: ObjectRecognitionConfig) => void;
}

const DEFAULT_CONFIG: ObjectRecognitionConfig = {
  targetObjectId: 'bottle',
};

const ObjectRecognitionContext = createContext<ObjectRecognitionContextType>({
  config: DEFAULT_CONFIG,
  setConfig: () => {},
});

export function ObjectRecognitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<ObjectRecognitionConfig>(DEFAULT_CONFIG);

  return (
    <ObjectRecognitionContext.Provider value={{ config, setConfig }}>
      {children}
    </ObjectRecognitionContext.Provider>
  );
}

export function useObjectRecognitionStore() {
  return useContext(ObjectRecognitionContext);
}
