export type RecognizableObjectCategory =
  | 'school'
  | 'home'
  | 'personal'
  | 'kitchen'
  | 'bathroom'
  | 'other';

export interface RecognizableObject {
  id: string;
  name: string;
  label: string;
  category: RecognizableObjectCategory;
  enabled: boolean;
}

export interface RecognizableObjectSeed
  extends Omit<RecognizableObject, 'enabled'> {
  enabled?: boolean;
}
