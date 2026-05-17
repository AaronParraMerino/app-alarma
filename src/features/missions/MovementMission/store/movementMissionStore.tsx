import React, { createContext, useContext, useState } from 'react';
import {
  MovementMissionConfig,
  MovementMissionUserConfig,
} from '../types/movement.types';
import { buildMovementMissionConfig } from '../services/movementMissionBuilder';

const DEFAULT_USER_CONFIG: MovementMissionUserConfig = {
  difficulty: 'easy',
  quantity: 1,
};

const DEFAULT_MISSION_CONFIG = buildMovementMissionConfig(DEFAULT_USER_CONFIG);

interface MovementMissionContextType {
  userConfig: MovementMissionUserConfig;
  missionConfig: MovementMissionConfig;
  setUserConfig: (config: MovementMissionUserConfig) => void;
  setMissionConfig: (config: MovementMissionConfig) => void;
  generateMission: (config?: MovementMissionUserConfig) => MovementMissionConfig;
  resetMission: () => void;
}

const MovementMissionContext = createContext<MovementMissionContextType>({
  userConfig: DEFAULT_USER_CONFIG,
  missionConfig: DEFAULT_MISSION_CONFIG,
  setUserConfig: () => {},
  setMissionConfig: () => {},
  generateMission: () => DEFAULT_MISSION_CONFIG,
  resetMission: () => {},
});

// Mantiene la configuracion actual de la mision de movimiento
export function MovementMissionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userConfig, setUserConfigState] =
    useState<MovementMissionUserConfig>(DEFAULT_USER_CONFIG);

  const [missionConfig, setMissionConfig] =
    useState<MovementMissionConfig>(DEFAULT_MISSION_CONFIG);

  // Actualiza config del usuario y regenera la secuencia
  const setUserConfig = (config: MovementMissionUserConfig) => {
    setUserConfigState(config);

    const generatedConfig = buildMovementMissionConfig(config);
    setMissionConfig(generatedConfig);
  };

  const generateMission = (
    config?: MovementMissionUserConfig,
  ): MovementMissionConfig => {
    // Genera una nueva mision con la config indicada o la actual
    const configToUse = config ?? userConfig;

    const generatedConfig = buildMovementMissionConfig(configToUse);

    setUserConfigState(configToUse);
    setMissionConfig(generatedConfig);

    return generatedConfig;
  };

  // Vuelve a la configuracion inicial
  const resetMission = () => {
    const generatedConfig = buildMovementMissionConfig(DEFAULT_USER_CONFIG);

    setUserConfigState(DEFAULT_USER_CONFIG);
    setMissionConfig(generatedConfig);
  };

  return (
    <MovementMissionContext.Provider
      value={{
        userConfig,
        missionConfig,
        setUserConfig,
        setMissionConfig,
        generateMission,
        resetMission,
      }}
    >
      {children}
    </MovementMissionContext.Provider>
  );
}

// Acceso rapido al contexto de MovementMission
export function useMovementMissionStore() {
  return useContext(MovementMissionContext);
}
