import { useEffect, useState } from 'react';

// Obtiene la hora y el dia actual para la mision
export function useCurrentTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    time: now.toLocaleTimeString('es', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    day: now.toLocaleDateString('es', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    }),
  };
}
