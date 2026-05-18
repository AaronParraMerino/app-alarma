import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Mission, MissionType, MissionDifficulty, MissionsState, MissionsContextType } from '../types/mission.types';

const initialState: MissionsState = {
  selectedMissions: [],
  isLoading: false,
  error: null,
};

type MissionsAction =
  | { type: 'ADD_MISSION'; payload: Mission }
  | { type: 'REMOVE_MISSION'; payload: string }
  | { type: 'COMPLETE_MISSION'; payload: string }
  | { type: 'CLEAR_MISSIONS' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

function missionsReducer(state: MissionsState, action: MissionsAction): MissionsState {
  switch (action.type) {
    case 'ADD_MISSION':
      return { ...state, selectedMissions: [...state.selectedMissions, action.payload] };
    case 'REMOVE_MISSION':
      return { ...state, selectedMissions: state.selectedMissions.filter(m => m.id !== action.payload) };
    case 'COMPLETE_MISSION':
      return {
        ...state,
        selectedMissions: state.selectedMissions.map(m =>
          m.id === action.payload ? { ...m, completed: true } : m
        ),
      };
    case 'CLEAR_MISSIONS':
      return { ...initialState };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

const MissionsContext = createContext<MissionsContextType | undefined>(undefined);

export function MissionsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(missionsReducer, initialState);

  const addMission = (type: MissionType, difficulty: MissionDifficulty) => {
    const mission: Mission = {
      id: `${type}-${Date.now()}`,
      type,
      difficulty: difficulty === 'random'
        ? (['easy', 'medium', 'hard'] as MissionDifficulty[])[Math.floor(Math.random() * 3)]
        : difficulty,
      completed: false,
    };
    dispatch({ type: 'ADD_MISSION', payload: mission });
  };

  const removeMission = (id: string) => dispatch({ type: 'REMOVE_MISSION', payload: id });
  const completeMission = (id: string) => dispatch({ type: 'COMPLETE_MISSION', payload: id });
  const clearMissions = () => dispatch({ type: 'CLEAR_MISSIONS' });
  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  return (
    <MissionsContext.Provider value={{ ...state, addMission, removeMission, completeMission, clearMissions, clearError }}>
      {children}
    </MissionsContext.Provider>
  );
}

export function useMissions(): MissionsContextType {
  const context = useContext(MissionsContext);
  if (!context) throw new Error('useMissions must be used within MissionsProvider');
  return context;
}