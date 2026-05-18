import { useState, useEffect } from 'react';

function getFormattedTime() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function getFormattedDate() {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[new Date().getDay()];
}

export function useCurrentTime() {
  const [time, setTime] = useState(getFormattedTime);
  const [day,  setDay]  = useState(getFormattedDate);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getFormattedTime());
      setDay(getFormattedDate());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { time, day };
}
