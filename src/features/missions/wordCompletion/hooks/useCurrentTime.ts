import { useEffect, useState } from 'react';
import { AppLanguage } from '../../../../shared/i18n/useTranslation';

function getNowParts(language: AppLanguage) {
  const now = new Date();
  const locale = language === 'es' ? 'es' : 'en';

  return {
    time: now.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }),
    day: now.toLocaleDateString(locale, {
      weekday: 'long',
    }),
  };
}

export function useCurrentTime(language: AppLanguage = 'es') {
  const [nowParts, setNowParts] = useState(() => getNowParts(language));

  useEffect(() => {
    setNowParts(getNowParts(language));

    const interval = setInterval(() => {
      setNowParts(getNowParts(language));
    }, 1000);

    return () => clearInterval(interval);
  }, [language]);

  return nowParts;
}
