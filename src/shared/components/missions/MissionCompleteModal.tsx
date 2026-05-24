import React from 'react';

import { Modal } from '../ui/Modal';
import { useTranslation } from '../../i18n/useTranslation';

type Props = {
  visible: boolean;
  completedCount?: number;
  totalCount?: number;
  onContinue: () => void;
  autoContinueMs?: number;
};

export function MissionCompleteModal({
  visible,
  completedCount,
  totalCount,
  onContinue,
  autoContinueMs = 1800,
}: Props) {
  const { language } = useTranslation();
  const isSpanish = language === 'es';
  const onContinueRef = React.useRef(onContinue);
  const hasProgress =
    typeof completedCount === 'number' &&
    typeof totalCount === 'number';

  React.useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);

  React.useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      onContinueRef.current();
    }, autoContinueMs);

    return () => clearTimeout(timeout);
  }, [autoContinueMs, visible]);

  return (
    <Modal
      visible={visible}
      type="success"
      title={isSpanish ? 'Mision completada' : 'Mission completed'}
      message={
        hasProgress
          ? isSpanish
            ? `Excelente trabajo. Resolviste esta mision correctamente. Progreso completado: ${completedCount} de ${totalCount}.`
            : `Excellent work. You solved this mission correctly. Progress completed: ${completedCount} of ${totalCount}.`
          : isSpanish
            ? 'Excelente trabajo. Resolviste esta mision correctamente.'
            : 'Excellent work. You solved this mission correctly.'
      }
      closeOnBackdropPress={false}
    />
  );
}
