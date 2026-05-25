import {
  Bbox,
  Detection,
} from 'react-native-executorch';

import { RecognizableObject } from '../types/objectRecognition.types';

export interface ObjectRecognitionResult {
  expectedObjectId: string;
  expectedLabel: string;
  detectedLabel: string;
  confidence: number;
  matched: boolean;
  boundingBox: Bbox | null;
}

interface ValidateObjectParams {
  detections: Detection<any>[];
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
    const matched = Boolean(
      bestMatch && bestMatch.score >= targetObject.minConfidence,
    );
    const bestDetection =
      matched
        ? bestMatch
        : [...detections]
            .sort((a, b) => b.score - a.score)[0];

    return Promise.resolve({
      expectedObjectId: targetObject.id,
      expectedLabel: targetObject.label,
      detectedLabel: bestDetection
        ? String(bestDetection.label)
        : 'No detectado',
      confidence: bestDetection?.score ?? 0,
      matched,
      boundingBox: bestDetection?.bbox ?? null,
    });
  }
}
