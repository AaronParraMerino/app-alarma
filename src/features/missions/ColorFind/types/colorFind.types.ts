export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ColorFindTile {
  id: string;
  color: string;
  isOdd: boolean;
}

export interface ColorFindChallenge {
  baseColor: string;
  oddColor: string;
  oddIndex: number;
  gridSize: number;
  tiles: ColorFindTile[];
}

export interface ColorFindConfig {
  difficulty: Difficulty;
  quantity: number;
}
