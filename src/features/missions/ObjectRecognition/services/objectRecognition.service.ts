import { Detection } from 'react-native-executorch';

import { RecognizableObject } from '../types/objectRecognition.types';

export interface ObjectRecognitionResult {
  expectedObjectId: string;
  expectedLabel: string;
  detectedLabel: string;
  confidence: number;
  matched: boolean;
}

interface ValidateObjectParams {
  detections: Detection[];
  targetObject: RecognizableObject;
}

export class ObjectRecognitionService {
  static validateObject({
    detections,
    targetObject,
  }: ValidateObjectParams): Promise<ObjectRecognitionResult> {
    const bestMatch = detections
      .filter(detection => String(detection.label) === targetObject.modelLabel)
      .sort((a, b) => b.score - a.score)[0];

    return Promise.resolve({
      expectedObjectId: targetObject.id,
      expectedLabel: targetObject.label,
      detectedLabel: bestMatch ? targetObject.label : 'No detectado',
      confidence: bestMatch?.score ?? 0,
      matched: Boolean(bestMatch),
    });
  }
}
