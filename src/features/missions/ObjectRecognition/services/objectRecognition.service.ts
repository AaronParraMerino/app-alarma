import { RecognizableObject } from '../types/objectRecognition.types';

export interface ObjectRecognitionResult {
  expectedObjectId: string;
  expectedLabel: string;
  detectedLabel: string;
  confidence: number;
  matched: boolean;
}

interface ValidateObjectParams {
  photoUri: string;
  targetObject: RecognizableObject;
}

export class ObjectRecognitionService {
  static async validateObject({
    photoUri,
    targetObject,
  }: ValidateObjectParams): Promise<ObjectRecognitionResult> {
    // Placeholder para la futura integracion con IA real.
    // Se mantiene async para conservar el contrato cuando conectemos el modelo/API.
    await new Promise(resolve => setTimeout(resolve, 700));

    return {
      expectedObjectId: targetObject.id,
      expectedLabel: targetObject.label,
      detectedLabel: targetObject.label,
      confidence: photoUri ? 0.92 : 0,
      matched: Boolean(photoUri),
    };
  }
}
