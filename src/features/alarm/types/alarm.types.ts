import { TriviaCategory } from '../../missions/Trivia/types/trivia.types';

export type MissionType =
  | 'random'
  | 'math'
  | 'memory'
  | 'physical'
  | 'photo'
  | 'trivia'
  | 'writing'
  | 'color'
  | 'colorFind'
  | 'shapes'
  | 'sequence'
  | 'wordCompletion';

export type Difficulty = 'easy' | 'normal' | 'hard';

export type RepeatDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Dom, 1=Lun ... 6=Sab

export interface AlarmMission {
  type: MissionType;
  difficulty: Difficulty;
  quantity?: number;
  operationType?: 'addition' | 'subtraction' | 'multiplication' | 'division';
  targetObjectIds?: string[];
  triviaCategoryIds?: TriviaCategory[];
  triviaTargetScore?: number;
}

export interface Alarm {
  id: string;
  hour: number;        // 0-23
  minute: number;      // 0-59
  label: string;
  enabled: boolean;
  repeatDays: RepeatDay[];   // [] = solo una vez
  missions: AlarmMission[];
  randomMissions: boolean;   // RF12
  soundUri: string | null;
  vibrationEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export type AlarmCreate = Omit<Alarm, 'id' | 'createdAt' | 'updatedAt'>;
