export type MissionType = 'math' | 'memory' | 'color' | 'photo' | 'writing';

export type MissionDifficulty = 'easy' | 'medium' | 'hard' | 'random';

export type Mission = {
  id: string;
  type: MissionType;
  difficulty: MissionDifficulty;
  completed: boolean;
};

export type MissionsState = {
  selectedMissions: Mission[];
  isLoading: boolean;
  error: string | null;
};

export type MissionsContextType = MissionsState & {
  addMission: (type: MissionType, difficulty: MissionDifficulty) => void;
  removeMission: (id: string) => void;
  completeMission: (id: string) => void;
  clearMissions: () => void;
  clearError: () => void;
};