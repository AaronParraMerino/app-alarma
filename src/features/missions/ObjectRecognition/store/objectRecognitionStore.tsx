import React, { createContext, useContext, useState } from 'react';
import {
  ObjectDetectionType,
  useObjectDetection,
  YOLO26X,
} from 'react-native-executorch';

export interface ObjectRecognitionConfig {
  difficulty: 'easy' | 'medium' | 'hard';
  targetObjectIds: string[];
}

interface ObjectRecognitionContextType {
  config: ObjectRecognitionConfig;
  detector: ObjectDetectionType<any>;
  setConfig: (config: ObjectRecognitionConfig) => void;
}

const DEFAULT_CONFIG: ObjectRecognitionConfig = {
  difficulty: 'easy',
  targetObjectIds: ['bottle', 'book', 'cup'],
};

const ObjectRecognitionContext = createContext<ObjectRecognitionContextType>({
  config: DEFAULT_CONFIG,
  detector: null as unknown as ObjectDetectionType<any>,
  setConfig: () => {},
});

export function ObjectRecognitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<ObjectRecognitionConfig>(DEFAULT_CONFIG);
  const detector = useObjectDetection({
    model: YOLO26X,
  });

  return (
    <ObjectRecognitionContext.Provider value={{ config, detector, setConfig }}>
      {children}
    </ObjectRecognitionContext.Provider>
  );
}

export function useObjectRecognitionStore() {
  return useContext(ObjectRecognitionContext);
}
