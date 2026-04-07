export type MissionType =
  | 'math'
  | 'memory'
  | 'physical'
  | 'photo'
  | 'trivia'
  | 'writing'
  | 'color'
  | 'shapes'
  | 'sequence';

export type Difficulty = 'easy' | 'normal' | 'hard';

export type RepeatDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Dom, 1=Lun ... 6=Sab

export interface AlarmMission {
  type: MissionType;
  difficulty: Difficulty;
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
  createdAt: number;
  updatedAt: number;
}

export type AlarmCreate = Omit<Alarm, 'id' | 'createdAt' | 'updatedAt'>;