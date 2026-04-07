import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Alarm, AlarmCreate } from '../types/alarm.types';

// ─── Mock inicial ────────────────────────────────────────────────────────────
// Cuando integres SQLite, reemplaza este array con la carga desde localDB.ts
const INITIAL_ALARMS: Alarm[] = [
  {
    id: '1',
    hour: 6,
    minute: 45,
    label: 'Clase de programación',
    enabled: true,
    repeatDays: [1, 2, 3, 4, 5],
    missions: [
      { type: 'math', difficulty: 'normal' },
      { type: 'physical', difficulty: 'easy' },
    ],
    randomMissions: false,
    soundUri: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '2',
    hour: 7,
    minute: 30,
    label: 'Examen parcial',
    enabled: true,
    repeatDays: [],
    missions: [
      { type: 'math', difficulty: 'hard' },
      { type: 'memory', difficulty: 'hard' },
      { type: 'trivia', difficulty: 'normal' },
    ],
    randomMissions: false,
    soundUri: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '3',
    hour: 8,
    minute: 0,
    label: 'Trabajo',
    enabled: false,
    repeatDays: [1, 2, 3, 4, 5],
    missions: [{ type: 'physical', difficulty: 'normal' }],
    randomMissions: false,
    soundUri: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// ─── Context ─────────────────────────────────────────────────────────────────
interface AlarmContextType {
  alarms: Alarm[];
  addAlarm: (data: AlarmCreate) => void;
  updateAlarm: (id: string, data: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
}

const AlarmContext = createContext<AlarmContextType | null>(null);

export function AlarmProvider({ children }: { children: ReactNode }) {
  const [alarms, setAlarms] = useState<Alarm[]>(INITIAL_ALARMS);

  const addAlarm = useCallback((data: AlarmCreate) => {
    const newAlarm: Alarm = {
      ...data,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setAlarms(prev => [...prev, newAlarm]);
    // TODO: localDB.insertAlarm(newAlarm)
    // TODO: if (isLoggedIn) cloudDB.upsertAlarm(newAlarm)
  }, []);

  const updateAlarm = useCallback((id: string, data: Partial<Alarm>) => {
    setAlarms(prev =>
      prev.map(a =>
        a.id === id ? { ...a, ...data, updatedAt: Date.now() } : a,
      ),
    );
    // TODO: localDB.updateAlarm(id, data)
  }, []);

  const deleteAlarm = useCallback((id: string) => {
    setAlarms(prev => prev.filter(a => a.id !== id));
    // TODO: localDB.deleteAlarm(id)
  }, []);

  const toggleAlarm = useCallback((id: string) => {
    setAlarms(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, enabled: !a.enabled, updatedAt: Date.now() }
          : a,
      ),
    );
    // TODO: localDB.updateAlarm(id, { enabled: !current })
  }, []);

  return (
    <AlarmContext.Provider
      value={{ alarms, addAlarm, updateAlarm, deleteAlarm, toggleAlarm }}
    >
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarmStore() {
  const ctx = useContext(AlarmContext);
  if (!ctx) throw new Error('useAlarmStore must be used within AlarmProvider');
  return ctx;
}