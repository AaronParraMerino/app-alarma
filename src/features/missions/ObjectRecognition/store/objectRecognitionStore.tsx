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

function ObjectRecognitionModelPreloader({
  detector,
}: {
  detector: ObjectDetectionType<any>;
}) {
  React.useEffect(() => {
    if (detector.error) {
      console.log(
        '[ObjectRecognition] Modelo local:',
        detector.error,
      );
    }
  }, [
    detector.error,
  ]);

  return null;
}

export function ObjectRecognitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<ObjectRecognitionConfig>(DEFAULT_CONFIG);
  // Mantiene el modelo montado desde el inicio de la app para acelerar la mision.
  const detector = useObjectDetection({
    model: YOLO26X,
  });

  return (
    <ObjectRecognitionContext.Provider value={{ config, detector, setConfig }}>
      <ObjectRecognitionModelPreloader detector={detector} />
      {children}
    </ObjectRecognitionContext.Provider>
  );
}

export function useObjectRecognitionStore() {
  return useContext(ObjectRecognitionContext);
}
