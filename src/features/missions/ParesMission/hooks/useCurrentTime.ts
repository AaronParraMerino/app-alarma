import { useEffect, useState } from 'react';
import { AppLanguage } from '../../../../shared/i18n/useTranslation';

// Obtiene la hora y el dia actual para la mision
export function useCurrentTime(language: AppLanguage = 'es') {
  const [now, setNow] = useState(() => new Date());
  const locale = language === 'es' ? 'es' : 'en';

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    time: now.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }),
    day: now.toLocaleDateString(locale, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    }),
  };
}
