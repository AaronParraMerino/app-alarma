import { ImageSourcePropType } from 'react-native';

export type PairsDifficulty = 'easy' | 'medium' | 'hard';

export interface PairCardAsset {
  id: string;
  name: string;
  source: ImageSourcePropType;
}

export interface PairCard {
  id: string;
  pairId: string;
  name: string;
  source: ImageSourcePropType | null;
  matched: boolean;
  fixed?: boolean;
}

export interface PairsMissionConfig {
  difficulty: PairsDifficulty;
  quantity: number;
}
