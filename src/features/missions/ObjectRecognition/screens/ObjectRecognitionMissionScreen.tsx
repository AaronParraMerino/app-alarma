// src/features/missions/ObjectRecognition/screens/ObjectRecognitionMissionScreen.tsx
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  Image,
  LayoutChangeEvent,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { CameraCapturedPicture } from 'expo-camera/build/Camera.types';
import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BackButton } from '../../../../shared/components/ui/BackButton';
import { Modal as AppModal } from '../../../../shared/components/ui/Modal';
import { Colors } from '../../../../shared/theme/colors';
import { Layout } from '../../../../shared/theme/layout';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../../shared/i18n/useTranslation';
import { MissionErrorCounter } from '../../../../shared/components/missions/MissionErrorCounter';
import { useAuth } from '../../../auth/hooks/useAuth';
import { MissionHistoryLocalService } from '../../../../shared/services/storage/MissionHistoryLocalService';
import { syncMissionHistory } from '../../../../shared/services/storage/missionHistorySync.service';

import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { ObjectBankService } from '../services/objectBank.service';
import {
  ObjectRecognitionResult,
  ObjectRecognitionService,
} from '../services/objectRecognition.service';
import { useObjectRecognitionStore } from '../store/objectRecognitionStore';
import { RecognizableObject } from '../types/objectRecognition.types';

type Props = NativeStackScreenProps<
  MissionsStackParamList,
  'ObjectRecognitionMissionScreen'
>;

type ObjectDifficulty =
  | 'easy'
  | 'medium'
  | 'hard';

const REQUIRED_RECOGNITIONS: Record<
  ObjectDifficulty,
  number
> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const ATTEMPTS_PER_OBJECT: Record<
  ObjectDifficulty,
  number
> = {
  easy: Number.POSITIVE_INFINITY,
  medium: 3,
  hard: 1,
};

const DOWNGRADE_FAILURE_LIMIT = 6;
const DOWNGRADE_TAP_COUNT = 6;

const DIFFICULTY_STYLES: Record<
  ObjectDifficulty,
  {
    accentColor: string;
    bgColor: string;
    textColor: string;
  }
> = {
  easy: {
    accentColor: '#4ADE80',
    bgColor: '#1A3D2B',
    textColor: '#052010',
  },

  medium: {
    accentColor: '#FBBF24',
    bgColor: '#3D2E0A',
    textColor: '#1A0E00',
  },

  hard: {
    accentColor: '#F87171',
    bgColor: '#3D1010',
    textColor: '#1A0000',
  },
};

function shuffleObjects(
  objects: RecognizableObject[],
): RecognizableObject[] {
  return [...objects]
    .sort(() => Math.random() - 0.5);
}

function pickReplacementObject(
  objects: RecognizableObject[],
  currentObjectId?: string,
): RecognizableObject | null {
  const candidates =
    objects.filter(
      (object) =>
        object.id !== currentObjectId,
    );

  const pool =
    candidates.length > 0
      ? candidates
      : objects;

  return pool[
    Math.floor(
      Math.random() * pool.length,
    )
  ] ?? null;
}

function normalizeText(
  value: string,
): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    );
}

function translateObjectLabel(
  label: string,
  isSpanish: boolean,
): string {
  if (isSpanish) {
    return label;
  }

  const normalized =
    normalizeText(label);

  const objectLabels: Record<string, string> = {
    cepillo: 'Brush',
    'cepillo de dientes': 'Toothbrush',
    pasta: 'Toothpaste',
    'pasta dental': 'Toothpaste',
    jabon: 'Soap',
    shampoo: 'Shampoo',
    toalla: 'Towel',

    taza: 'Cup',
    vaso: 'Glass',
    plato: 'Plate',
    cuchara: 'Spoon',
    tenedor: 'Fork',
    cuchillo: 'Knife',
    botella: 'Bottle',

    libro: 'Book',
    cuaderno: 'Notebook',
    lapiz: 'Pencil',
    boligrafo: 'Pen',
    marcador: 'Marker',
    regla: 'Ruler',
    mochila: 'Backpack',

    llave: 'Key',
    llaves: 'Keys',
    celular: 'Phone',
    telefono: 'Phone',
    cargador: 'Charger',
    billetera: 'Wallet',
    reloj: 'Watch',
    lentes: 'Glasses',

    zapato: 'Shoe',
    zapatos: 'Shoes',
    ropa: 'Clothes',
    control: 'Remote control',
    'control remoto': 'Remote control',
  };

  return objectLabels[normalized] ?? label;
}

function getDifficultyLabel(
  difficulty: ObjectDifficulty,
  isSpanish: boolean,
): string {
  if (difficulty === 'easy') {
    return isSpanish
      ? 'FÁCIL'
      : 'EASY';
  }

  if (difficulty === 'medium') {
    return isSpanish
      ? 'MEDIO'
      : 'MEDIUM';
  }

  return isSpanish
    ? 'DIFÍCIL'
    : 'HARD';
}

type DetectionBoxStyle = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function getMissionDifficultyLabel(
  difficulty: ObjectDifficulty,
  isSpanish: boolean,
): string {
  if (difficulty === 'easy') {
    return isSpanish ? 'FACIL' : 'EASY';
  }

  if (difficulty === 'medium') {
    return isSpanish ? 'MEDIO' : 'MEDIUM';
  }

  return isSpanish ? 'DIFICIL' : 'HARD';
}

function parseAlarmLabel(value?: string) {
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d{2}:\d{2})(?:\s-\s(.+))?$/);

  return {
    time: match?.[1] ?? value,
    label: match?.[2],
  };
}

function getDetectionBoxStyle(
  boundingBox: ObjectRecognitionResult['boundingBox'],
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): DetectionBoxStyle | null {
  if (
    !boundingBox ||
    imageWidth <= 0 ||
    imageHeight <= 0 ||
    frameWidth <= 0 ||
    frameHeight <= 0
  ) {
    return null;
  }

  const normalizedCoordinates =
    Math.max(
      boundingBox.x1,
      boundingBox.x2,
      boundingBox.y1,
      boundingBox.y2,
    ) <= 1.5;
  const xFactor =
    normalizedCoordinates ? imageWidth : 1;
  const yFactor =
    normalizedCoordinates ? imageHeight : 1;
  const scale =
    Math.max(
      frameWidth / imageWidth,
      frameHeight / imageHeight,
    );
  const offsetX =
    (frameWidth - imageWidth * scale) / 2;
  const offsetY =
    (frameHeight - imageHeight * scale) / 2;
  const left =
    Math.max(
      0,
      boundingBox.x1 * xFactor * scale +
        offsetX,
    );
  const top =
    Math.max(
      0,
      boundingBox.y1 * yFactor * scale +
        offsetY,
    );
  const right =
    Math.min(
      frameWidth,
      boundingBox.x2 * xFactor * scale +
        offsetX,
    );
  const bottom =
    Math.min(
      frameHeight,
      boundingBox.y2 * yFactor * scale +
        offsetY,
    );

  if (right <= left || bottom <= top) {
    return null;
  }

  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}

type ObjectRecognitionMissionContentProps = {
  difficulty?: ObjectDifficulty;
  targetObjectIds?: string[];
  alarmLabel?: string;
  onBack?: () => void;
  onComplete?: () => void;
  onMistake?: () => void;
};

export function ObjectRecognitionMissionContent({
  difficulty,
  targetObjectIds: routeTargetObjectIds,
  alarmLabel,
  onBack,
  onComplete,
  onMistake,
}: ObjectRecognitionMissionContentProps) {
  const {
    colors,
    statusBarStyle,
  } = useAppTheme();
  const {
    width,
  } = useWindowDimensions();

  const {
    language,
  } = useTranslation();
  const {
    user,
    isAuthenticated,
    isGuest,
  } = useAuth();

  const isSpanish =
    language === 'es';
  const alarmInfo =
    React.useMemo(() => parseAlarmLabel(alarmLabel), [alarmLabel]);

  const cameraRef =
    React.useRef<CameraView>(null);

  const [
    permission,
    requestPermission,
  ] = useCameraPermissions();

  const {
    config,
    detector,
  } = useObjectRecognitionStore();

  const initialDifficulty =
    difficulty ?? config.difficulty;

  const targetObjectIds =
    routeTargetObjectIds ??
    config.targetObjectIds;

  const [
    activeDifficulty,
    setActiveDifficulty,
  ] = useState<ObjectDifficulty>(
    initialDifficulty,
  );

  const [
    objectPool,
    setObjectPool,
  ] = useState<RecognizableObject[]>([]);

  const [
    targetObjects,
    setTargetObjects,
  ] = useState<RecognizableObject[]>([]);

  const [
    currentTargetIndex,
    setCurrentTargetIndex,
  ] = useState(0);

  const [
    failedAttempts,
    setFailedAttempts,
  ] = useState(0);

  const [
    recognizedObjectIds,
    setRecognizedObjectIds,
  ] = useState<string[]>([]);

  const [
    recognitionGoal,
    setRecognitionGoal,
  ] = useState(
    REQUIRED_RECOGNITIONS[initialDifficulty],
  );

  const [
    roundExhausted,
    setRoundExhausted,
  ] = useState(false);

  const [
    failedObjectIds,
    setFailedObjectIds,
  ] = useState<string[]>([]);

  const [
    lowerLevelAvailable,
    setLowerLevelAvailable,
  ] = useState(false);

  const [
    ,
    setDowngradeTapCount,
  ] = useState(0);

  const [
    giveUpVisible,
    setGiveUpVisible,
  ] = useState(false);

  const [
    photo,
    setPhoto,
  ] = useState<CameraCapturedPicture | null>(
    null,
  );

  const [
    cameraReady,
    setCameraReady,
  ] = useState(false);

  const [
    capturing,
    setCapturing,
  ] = useState(false);

  const [
    validating,
    setValidating,
  ] = useState(false);

  const [
    recognitionResult,
    setRecognitionResult,
  ] = useState<ObjectRecognitionResult | null>(
    null,
  );

  const [
    photoFrame,
    setPhotoFrame,
  ] = useState({
    width: 0,
    height: 0,
  });

  const [
    modalPhotoFrame,
    setModalPhotoFrame,
  ] = useState({
    width: 0,
    height: 0,
  });

  const targetObject =
    targetObjects[currentTargetIndex] ?? null;

  const requiredRecognitions =
    recognitionGoal;

  const recognizedCount =
    recognizedObjectIds.length;

  const maxAttempts =
    ATTEMPTS_PER_OBJECT[activeDifficulty];

  const missionCompleted =
    Boolean(recognitionResult?.matched) &&
    recognizedCount >= requiredRecognitions;

  const lowerDifficulty =
    activeDifficulty === 'hard'
      ? 'medium'
      : 'easy';

  const downgradeFailureGoal =
    Math.max(
      1,
      Math.min(
        DOWNGRADE_FAILURE_LIMIT,
        targetObjects.length || DOWNGRADE_FAILURE_LIMIT,
      ),
    );

  const downgradeFailureCount =
    Math.min(
      failedObjectIds.length,
      downgradeFailureGoal,
    );

  const remainingOnLowerLevel =
    Math.min(
      Math.max(
        requiredRecognitions - recognizedCount,
        1,
      ),
      REQUIRED_RECOGNITIONS[lowerDifficulty],
    );

  const difficultyStyle =
    DIFFICULTY_STYLES[activeDifficulty];

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [
    onComplete,
  ]);

  useEffect(() => {
    const objectPool =
      ObjectBankService.getEnabled();

    const selectedPool =
      objectPool.filter((object) =>
        targetObjectIds.includes(object.id),
      );

    const pool =
      selectedPool.length > 0
        ? selectedPool
        : objectPool;

    setActiveDifficulty(initialDifficulty);
    setObjectPool(pool);
    setTargetObjects(shuffleObjects(pool));
    setCurrentTargetIndex(0);
    setFailedAttempts(0);
    setRecognizedObjectIds([]);
    setRecognitionGoal(
      REQUIRED_RECOGNITIONS[initialDifficulty],
    );
    setRoundExhausted(false);
    setFailedObjectIds([]);
    setLowerLevelAvailable(false);
    setDowngradeTapCount(0);
    setPhoto(null);
    setRecognitionResult(null);
  }, [
    initialDifficulty,
    targetObjectIds,
  ]);

  const advanceTarget =
    useCallback(() => {
      setFailedAttempts(0);
      setPhoto(null);
      setRecognitionResult(null);

      if (
        currentTargetIndex >=
        targetObjects.length - 1
      ) {
        setRoundExhausted(true);
        return;
      }

      setCurrentTargetIndex(
        (index) => index + 1,
      );
    }, [
      activeDifficulty,
      currentTargetIndex,
      targetObjects.length,
    ]);

  const registerFailedObject =
    useCallback(() => {
      if (
        activeDifficulty === 'easy' ||
        !targetObject
      ) {
        return;
      }

      setFailedObjectIds((ids) => {
        if (ids.includes(targetObject.id)) {
          return ids;
        }

        const nextIds = [
          ...ids,
          targetObject.id,
        ];

        const downgradeThreshold =
          Math.max(
            1,
            Math.min(
              DOWNGRADE_FAILURE_LIMIT,
              targetObjects.length || DOWNGRADE_FAILURE_LIMIT,
            ),
          );

        return nextIds;
      });
    }, [
      activeDifficulty,
      targetObject,
      targetObjects.length,
    ]);

  const restartRound =
    useCallback((nextDifficulty = activeDifficulty) => {
      const roundPool =
        nextDifficulty === 'easy'
          ? objectPool
          : objectPool.filter(
              (object) =>
                !recognizedObjectIds.includes(
                  object.id,
                ),
            );

      setActiveDifficulty(nextDifficulty);
      setTargetObjects(shuffleObjects(roundPool));
      setCurrentTargetIndex(0);
      setFailedAttempts(0);
      setFailedObjectIds([]);
      setRoundExhausted(false);
      setLowerLevelAvailable(false);
      setPhoto(null);
      setRecognitionResult(null);
      setDowngradeTapCount(0);
    }, [
      activeDifficulty,
      objectPool,
      recognizedObjectIds,
    ]);

  const downgradeLevel =
    useCallback(() => {
      setActiveDifficulty(lowerDifficulty);
      setRecognitionGoal(remainingOnLowerLevel);
      setRecognizedObjectIds([]);
      setTargetObjects(shuffleObjects(objectPool));
      setCurrentTargetIndex(0);
      setFailedAttempts(0);
      setFailedObjectIds([]);
      setRoundExhausted(false);
      setLowerLevelAvailable(false);
      setDowngradeTapCount(0);
      setPhoto(null);
      setRecognitionResult(null);
    }, [
      lowerDifficulty,
      objectPool,
      remainingOnLowerLevel,
    ]);

  const changeEasyTarget =
    useCallback(() => {
      const replacement =
        pickReplacementObject(
          objectPool,
          targetObject?.id,
        );

      if (!replacement) {
        return;
      }

      setTargetObjects([replacement]);
      setCurrentTargetIndex(0);
      setFailedAttempts(0);
      setRoundExhausted(false);
      setPhoto(null);
      setRecognitionResult(null);
    }, [
      objectPool,
      targetObject?.id,
    ]);

  const handleDifficultyBadgePress =
    useCallback(() => {
      if (
        activeDifficulty === 'easy' ||
        missionCompleted ||
        (
          failedAttempts === 0 &&
          failedObjectIds.length === 0
        )
      ) {
        setDowngradeTapCount(0);
        return;
      }

      setDowngradeTapCount((count) => {
        const nextCount =
          count + 1;

        if (nextCount >= DOWNGRADE_TAP_COUNT) {
          setLowerLevelAvailable(true);
          setGiveUpVisible(true);
          return 0;
        }

        return nextCount;
      });
    }, [
      activeDifficulty,
      failedAttempts,
      failedObjectIds.length,
      missionCompleted,
    ]);

  const saveMissionHistory =
    useCallback((
      result: ObjectRecognitionResult,
      nextFailedAttempts: number,
    ) => {
      if (
        !isAuthenticated ||
        isGuest ||
        !user?.id ||
        !targetObject
      ) {
        return;
      }

      MissionHistoryLocalService.save({
        userId: user.id,
        missionType: 'object_recognition',
        difficulty: activeDifficulty,
        content: {
          targetId: targetObject.id,
          targetName: targetObject.name,
          targetLabel: targetObject.label,
          detectedLabel:
            result.detectedLabel ?? null,
          confidence: result.confidence,
          attempt: nextFailedAttempts,
          requiredRecognitions,
          recognizedBefore: recognizedCount,
        },
        correctAnswer: targetObject.label,
        userAnswer:
          result.detectedLabel ??
          (result.matched
            ? targetObject.label
            : 'not_detected'),
        success: result.matched,
        errorCount: result.matched
          ? failedObjectIds.length
          : failedObjectIds.length + 1,
        durationSeconds: null,
      });

      void syncMissionHistory(user.id);
    }, [
      activeDifficulty,
      failedObjectIds.length,
      isAuthenticated,
      isGuest,
      recognizedCount,
      requiredRecognitions,
      targetObject,
      user?.id,
    ]);

  const validatePhoto = useCallback(
    async (
      picture: CameraCapturedPicture,
    ) => {
      if (
        !targetObject ||
        validating ||
        !detector.isReady
      ) {
        return;
      }

      setValidating(true);

      try {
        const detections =
          await detector.forward(
            picture.uri,
            {
              detectionThreshold:
                Math.max(
                  targetObject.minConfidence - 0.15,
                  0.25,
                ),
              inputSize: 640,
            },
          );

        const result =
          await ObjectRecognitionService.validateObject({
            detections,
            targetObject,
          });

        if (!result.matched) {
          const nextFailedAttempts =
            failedAttempts + 1;

          onMistake?.();
          saveMissionHistory(
            result,
            nextFailedAttempts,
          );

          if (nextFailedAttempts >= maxAttempts) {
            setFailedAttempts(nextFailedAttempts);
            setRecognitionResult(result);
            return;
          }

          setFailedAttempts(
            nextFailedAttempts,
          );
        } else {
          setFailedAttempts(0);
          setDowngradeTapCount(0);
          saveMissionHistory(result, 0);
          setRecognizedObjectIds(
            (ids) =>
              ids.includes(targetObject.id)
                ? ids
                : [...ids, targetObject.id],
          );
        }

        setRecognitionResult(result);
      } catch (error) {
        console.log(
          '[ObjectRecognitionMission] No se pudo validar el objeto:',
          error,
        );
      } finally {
        setValidating(false);
      }
    },
    [
      detector,
      failedAttempts,
      maxAttempts,
      onMistake,
      saveMissionHistory,
      targetObject,
      validating,
    ],
  );

  useEffect(() => {
    if (
      activeDifficulty !== 'easy' &&
      failedObjectIds.length >= downgradeFailureGoal
    ) {
      downgradeLevel();
    }
  }, [
    activeDifficulty,
    downgradeFailureGoal,
    downgradeLevel,
    failedObjectIds.length,
  ]);

  useEffect(() => {
    if (
      photo &&
      detector.isReady &&
      !validating &&
      !recognitionResult
    ) {
      void validatePhoto(photo);
    }
  }, [
    detector.isReady,
    photo,
    recognitionResult,
    validatePhoto,
    validating,
  ]);

  useEffect(() => {
    if (
      !recognitionResult ||
      recognitionResult.matched ||
      failedAttempts < maxAttempts
    ) {
      return;
    }

    const timer =
      setTimeout(() => {
        registerFailedObject();
        advanceTarget();
      }, 1200);

    return () => clearTimeout(timer);
  }, [
    advanceTarget,
    failedAttempts,
    maxAttempts,
    recognitionResult,
    registerFailedObject,
  ]);

  const takePhoto = async () => {
    if (
      !cameraRef.current ||
      !cameraReady ||
      capturing ||
      !targetObject ||
      roundExhausted
    ) {
      return;
    }

    setCapturing(true);

    try {
      const picture =
        await cameraRef.current.takePictureAsync({
          quality: 0.7,
          skipProcessing: false,
        });

      setPhoto(picture);
      setRecognitionResult(null);
    } catch (error) {
      console.log(
        '[ObjectRecognitionMission] No se pudo tomar la foto:',
        error,
      );
    } finally {
      setCapturing(false);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView
        style={[
          styles.safe,
          {
            backgroundColor: colors.bg,
          },
        ]}
      >
        <StatusBar
          backgroundColor={colors.bg}
          barStyle={statusBarStyle}
        />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView
        style={[
          styles.safe,
          {
            backgroundColor: colors.bg,
          },
        ]}
      >
        <StatusBar
          backgroundColor={colors.bg}
          barStyle={statusBarStyle}
        />

        <View style={styles.permissionContent}>
          <Ionicons
            name="camera-outline"
            size={58}
            color={
              difficultyStyle.accentColor
            }
          />

          <Text style={styles.title}>
            {isSpanish
              ? 'Permiso de cámara'
              : 'Camera permission'}
          </Text>

          <Text style={styles.note}>
            {isSpanish
              ? 'Necesitamos usar la cámara para iniciar la misión de objetos.'
              : 'We need to use the camera to start the object mission.'}
          </Text>

          <TouchableOpacity
            style={[
              styles.completeBtn,
              {
                backgroundColor:
                  difficultyStyle.accentColor,
              },
            ]}
            onPress={requestPermission}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.completeText,
                {
                  color:
                    difficultyStyle.textColor,
                },
              ]}
            >
              {isSpanish
                ? 'Permitir cámara'
                : 'Allow camera'}
            </Text>
          </TouchableOpacity>

          {onBack ? (
            <BackButton
              label={
                isSpanish
                  ? 'Volver'
                  : 'Back'
              }
              onPress={onBack}
            />
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  const targetObjectName =
    targetObject
      ? translateObjectLabel(
          targetObject.label,
          isSpanish,
        )
      : isSpanish
        ? 'Objeto'
        : 'Object';

  const detectedObject =
    objectPool.find(
      (object) =>
        object.modelLabel ===
        recognitionResult?.detectedLabel,
    );

  const detectedLabel =
    recognitionResult?.detectedLabel
      ? detectedObject
        ? translateObjectLabel(
            detectedObject.label,
            isSpanish,
          )
        : recognitionResult.detectedLabel
      : '';

  const detectionBoxStyle =
    photo
      ? getDetectionBoxStyle(
          recognitionResult?.boundingBox ?? null,
          photo.width,
          photo.height,
          photoFrame.width,
          photoFrame.height,
        )
      : null;

  const modalDetectionBoxStyle =
    photo
      ? getDetectionBoxStyle(
          recognitionResult?.boundingBox ?? null,
          photo.width,
          photo.height,
          modalPhotoFrame.width,
          modalPhotoFrame.height,
        )
      : null;

  const noteText =
    roundExhausted
      ? activeDifficulty === 'hard'
        ? isSpanish
          ? 'Terminaste la ronda. Puedes pedir una mision mas sencilla.'
          : 'You finished the round. You can request an easier mission.'
        : isSpanish
          ? 'Terminaste la ronda. Busca otro objeto para continuar.'
          : 'You finished the round. Find another object to continue.'
      : recognitionResult
        ? recognitionResult.matched
          ? isSpanish
            ? `Detectado: ${detectedLabel} (${Math.round(
                recognitionResult.confidence * 100,
              )}%)`
            : `Detected: ${detectedLabel} (${Math.round(
                recognitionResult.confidence * 100,
              )}%)`
          : isSpanish
            ? 'Toma una nueva foto para continuar.'
            : 'Take a new photo to continue.'
      : validating
        ? isSpanish
          ? 'Analizando la foto...'
          : 'Analyzing the photo...'
        : detector.error
          ? isSpanish
            ? 'No se pudo cargar el modelo local de reconocimiento.'
            : 'The local recognition model could not be loaded.'
          : !detector.isReady
            ? isSpanish
              ? `Preparando IA local ${Math.round(
                  detector.downloadProgress * 100,
                )}%`
              : `Preparing local AI ${Math.round(
                  detector.downloadProgress * 100,
                )}%`
            : downgradeFailureCount > 0 &&
              activeDifficulty !== 'easy'
              ? isSpanish
                ? `Fallos de nivel ${downgradeFailureCount}/${downgradeFailureGoal}. Toma otra foto.`
                : `Level failures ${downgradeFailureCount}/${downgradeFailureGoal}. Take another photo.`
              : isSpanish
                ? 'Toma una foto y valida el objeto antes de completar.'
                : 'Take a photo and validate the object before completing.';

  return (
    <SafeAreaView
      style={[
        styles.safe,
        {
          backgroundColor: colors.bg,
        },
      ]}
    >
      <StatusBar
        backgroundColor={colors.bg}
        barStyle={statusBarStyle}
      />

      <Modal
        visible={Boolean(
          recognitionResult?.matched,
        )}
        transparent
        animationType="fade"
        onRequestClose={
          missionCompleted
            ? handleComplete
            : advanceTarget
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View
              style={[
                styles.successIcon,
                {
                  backgroundColor:
                    difficultyStyle.accentColor,
                },
              ]}
            >
              <Ionicons
                name="checkmark"
                size={38}
                color={Colors.white}
              />
            </View>

            <Text style={styles.modalTitle}>
              {missionCompleted
                ? isSpanish
                  ? 'Misión completada'
                  : 'Mission completed'
                : isSpanish
                  ? 'Objeto reconocido'
                  : 'Object recognized'}
            </Text>

            {photo && (
              <View style={styles.modalPhoto}>
                <Image
                  source={{
                    uri: photo.uri,
                  }}
                  style={styles.modalPhotoImage}
                  resizeMode="cover"
                  onLayout={(
                    event: LayoutChangeEvent,
                  ) => {
                    const {
                      width,
                      height,
                    } = event.nativeEvent.layout;

                    setModalPhotoFrame({
                      width,
                      height,
                    });
                  }}
                />

                {modalDetectionBoxStyle && (
                  <View
                    pointerEvents="none"
                    style={styles.detectionOverlay}
                  >
                    <View
                      style={[
                        styles.detectionBox,
                        modalDetectionBoxStyle,
                        {
                          borderColor:
                            difficultyStyle.accentColor,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.detectionLabel,
                          {
                            backgroundColor:
                              difficultyStyle.accentColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.detectionLabelText,
                            {
                              color:
                                difficultyStyle.textColor,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {detectedLabel}
                          {' '}
                          {Math.round(
                            (recognitionResult?.confidence ??
                              0) * 100,
                          )}
                          %
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            <Text
              style={[
                styles.modalObject,
                {
                  color:
                    difficultyStyle.accentColor,
                },
              ]}
            >
              {targetObjectName}
            </Text>

            <Text style={styles.modalNote}>
              {isSpanish
                ? `${recognizedCount} de ${
                    requiredRecognitions
                  } reconocidos - Confianza ${Math.round(
                    (recognitionResult?.confidence ??
                      0) * 100,
                  )}%`
                : `${recognizedCount} of ${
                    requiredRecognitions
                  } recognized - Confidence ${Math.round(
                    (recognitionResult?.confidence ??
                      0) * 100,
                  )}%`}
            </Text>

            <TouchableOpacity
              style={[
                styles.modalBtn,
                {
                  backgroundColor:
                    difficultyStyle.accentColor,
                },
              ]}
              onPress={() => {
                if (missionCompleted) {
                  handleComplete();
                  return;
                }

                advanceTarget();
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.modalBtnText,
                  {
                    color:
                      difficultyStyle.textColor,
                  },
                ]}
              >
                {missionCompleted
                  ? isSpanish
                    ? 'Aceptar'
                    : 'Accept'
                  : isSpanish
                    ? 'Siguiente objeto'
                    : 'Next object'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AppModal
        visible={giveUpVisible}
        type="warning"
        title={
          isSpanish
            ? '¿Seguro que quieres bajar de nivel?'
            : 'Are you sure you want to lower the level?'
        }
        message={
          isSpanish
            ? `La misión bajará a ${lowerDifficulty === 'medium' ? 'medio' : 'fácil'}. Deberás reconocer ${remainingOnLowerLevel} objeto${remainingOnLowerLevel === 1 ? '' : 's'}.`
            : `The mission will change to ${lowerDifficulty}. You will need to recognize ${remainingOnLowerLevel} object${remainingOnLowerLevel === 1 ? '' : 's'}.`
        }
        closeOnBackdropPress
        onClose={() => setGiveUpVisible(false)}
        cancelAction={{
          label: isSpanish ? 'Seguir intentando' : 'Keep trying',
          onPress: () => setGiveUpVisible(false),
        }}
        confirmAction={{
          label: isSpanish ? 'Sí, bajar nivel' : 'Yes, lower level',
          onPress: () => {
            setGiveUpVisible(false);
            downgradeLevel();
          },
        }}
      />

      <View style={styles.content}>
        {onBack ? (
          <BackButton
            label={
              isSpanish
                ? 'Volver'
                : 'Back'
            }
            onPress={onBack}
          />
        ) : null}

        <View style={styles.topRow}>
          <TouchableOpacity
            style={[
              styles.badge,
              {
                backgroundColor:
                  difficultyStyle.bgColor,
                borderColor:
                  difficultyStyle.accentColor +
                  '40',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isSpanish
                ? 'Nivel de detectar objetos'
                : 'Object detection level'
            }
            onPress={handleDifficultyBadgePress}
            activeOpacity={
              lowerLevelAvailable ? 0.78 : 1
            }
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color:
                    difficultyStyle.accentColor,
                },
              ]}
            >
              {getMissionDifficultyLabel(
                activeDifficulty,
                isSpanish,
              )}
            </Text>
          </TouchableOpacity>
        </View>

        {alarmInfo ? (
          <View style={styles.timeBlock}>
            <Text
              style={[
                styles.time,
                {
                  color: colors.text,
                  fontSize:
                    width < 380 ? 44 : 52,
                },
              ]}
            >
              {alarmInfo.time}
            </Text>

            <Text
              style={[
                styles.dateLabel,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {alarmInfo.label ??
                (
                  isSpanish
                    ? 'Hora de levantarse'
                    : 'Time to wake up'
                )}
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.cameraCard,
            {
              borderColor:
                difficultyStyle.accentColor +
                '55',
            },
          ]}
        >
          {photo ? (
            <>
              <Image
                source={{
                  uri: photo.uri,
                }}
                style={styles.camera}
                resizeMode="cover"
                onLayout={(
                  event: LayoutChangeEvent,
                ) => {
                  const {
                    width,
                    height,
                  } = event.nativeEvent.layout;

                  setPhotoFrame({
                    width,
                    height,
                  });
                }}
              />

              {recognitionResult &&
                detectionBoxStyle && (
                  <View
                    pointerEvents="none"
                    style={styles.detectionOverlay}
                  >
                    <View
                      style={[
                        styles.detectionBox,
                        detectionBoxStyle,
                        {
                          borderColor:
                            recognitionResult.matched
                              ? difficultyStyle.accentColor
                              : Colors.danger,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.detectionLabel,
                          {
                            backgroundColor:
                              recognitionResult.matched
                                ? difficultyStyle.accentColor
                                : Colors.danger,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.detectionLabelText,
                            {
                              color:
                                recognitionResult.matched
                                  ? difficultyStyle.textColor
                                  : Colors.white,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {detectedLabel}
                          {' '}
                          {Math.round(
                            recognitionResult.confidence *
                              100,
                          )}
                          %
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

              {recognitionResult &&
                !recognitionResult.matched && (
                  <View style={styles.failedPhotoOverlay}>
                    <View style={styles.failedPhotoMessage}>
                      <Ionicons
                        name="close-circle-outline"
                        size={22}
                        color={Colors.white}
                      />
                      <Text style={styles.failedPhotoText}>
                        {isSpanish
                          ? 'Este no es el objeto'
                          : 'This is not the object'}
                      </Text>
                    </View>
                  </View>
                )}
            </>
          ) : (
            <>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="back"
                onCameraReady={() =>
                  setCameraReady(true)
                }
              />

              <View style={styles.cameraOverlay}>
                <View
                  style={[
                    styles.scanFrame,
                    {
                      borderColor:
                        difficultyStyle.accentColor,
                    },
                  ]}
                />
              </View>
            </>
          )}

        </View>

        <View
          style={[
            styles.targetInfo,
            {
              borderColor:
                difficultyStyle.accentColor +
                '55',
              backgroundColor:
                difficultyStyle.bgColor,
            },
          ]}
        >
          <View style={styles.targetTitleRow}>
            <Text style={styles.title}>
              {isSpanish
                ? 'Busca este objeto'
                : 'Find this object'}
            </Text>
            {activeDifficulty === 'medium' &&
              failedAttempts > 0 &&
              !roundExhausted &&
              !missionCompleted && (
                <TouchableOpacity
                  style={[
                    styles.targetChangeBtn,
                    {
                      borderColor:
                        difficultyStyle.accentColor,
                    },
                  ]}
                  onPress={() => {
                    registerFailedObject();
                    advanceTarget();
                  }}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.targetChangeText,
                      {
                        color:
                          difficultyStyle.accentColor,
                      },
                    ]}
                  >
                    {isSpanish
                      ? 'Cambiar objeto'
                      : 'Change object'}
                  </Text>
                </TouchableOpacity>
              )}

            {activeDifficulty === 'easy' &&
              objectPool.length > 1 &&
              !missionCompleted && (
                <TouchableOpacity
                  style={[
                    styles.targetChangeBtn,
                    {
                      borderColor:
                        difficultyStyle.accentColor,
                    },
                  ]}
                  onPress={changeEasyTarget}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.targetChangeText,
                      {
                        color:
                          difficultyStyle.accentColor,
                      },
                    ]}
                  >
                    {isSpanish
                      ? 'Cambiar objeto'
                      : 'Change object'}
                  </Text>
                </TouchableOpacity>
              )}
          </View>

          <View style={styles.objectActionRow}>
            <Text style={styles.objectName}>
              {targetObjectName}
            </Text>

            {!roundExhausted &&
              !missionCompleted &&
              !recognitionResult?.matched && (
              <View
                style={[
                  styles.cameraCaptureHalo,
                  {
                    borderColor:
                      difficultyStyle.accentColor +
                      '66',
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.cameraCaptureBtn,
                    {
                      borderColor: Colors.black,
                      backgroundColor: 'transparent',
                    },
                    (
                      capturing ||
                      (!photo && (
                        !cameraReady ||
                        !targetObject
                      ))
                    ) &&
                      styles.disabledBtn,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    validating
                      ? isSpanish
                        ? 'Analizando imagen'
                        : 'Analyzing image'
                      : photo
                        ? isSpanish
                          ? 'Tomar otra foto'
                          : 'Take another photo'
                        : isSpanish
                          ? 'Tomar foto'
                          : 'Take photo'
                  }
                  onPress={() => {
                    if (photo) {
                      setPhoto(null);
                      setRecognitionResult(null);
                      return;
                    }

                    void takePhoto();
                  }}
                  activeOpacity={0.85}
                  disabled={
                    validating
                    || capturing
                    || (!photo && (
                      !cameraReady ||
                      !targetObject
                    ))
                  }
                >
                  <View
                    style={[
                      styles.cameraCaptureFill,
                      {
                        backgroundColor:
                          difficultyStyle.accentColor,
                      },
                    ]}
                  />
                  <Ionicons
                    name={
                      photo
                          ? 'camera-reverse-outline'
                          : 'camera-outline'
                    }
                    size={34}
                    color={difficultyStyle.textColor}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text
            style={[
              styles.progressText,
              {
                color:
                  difficultyStyle.accentColor,
              },
            ]}
          >
            {targetObjects.length > 0
              ? isSpanish
                ? `${recognizedCount}/${requiredRecognitions} reconocidos`
                : `${recognizedCount}/${requiredRecognitions} recognized`
              : isSpanish
                ? 'Sin objetos'
                : 'No objects'}
          </Text>

          <Text
            style={[
              styles.note,
              validating && styles.analyzingText,
              validating && {
                color: colors.textSecondary,
                textShadowColor:
                  difficultyStyle.accentColor,
              },
            ]}
          >
            {noteText}
          </Text>

          {activeDifficulty !== 'easy' && !roundExhausted && (
            <MissionErrorCounter
              count={downgradeFailureCount}
              max={downgradeFailureGoal}
              color={difficultyStyle.accentColor}
            />
          )}

        </View>

        {roundExhausted ? (
          <View style={styles.roundActions}>
            <TouchableOpacity
              style={[
                styles.completeBtn,
                {
                  backgroundColor:
                    difficultyStyle.accentColor,
                },
              ]}
              onPress={() => restartRound()}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.completeText,
                  {
                    color:
                      difficultyStyle.textColor,
                  },
                ]}
              >
                {isSpanish
                  ? 'Encontrar otro'
                  : 'Find another'}
              </Text>
            </TouchableOpacity>

            {false &&
              activeDifficulty !== 'easy' &&
              lowerLevelAvailable && (
              <TouchableOpacity
                style={styles.giveUpBtn}
                onPress={() => setGiveUpVisible(true)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.giveUpText,
                    {
                      color:
                        colors.textMuted,
                    },
                  ]}
                >
                  {activeDifficulty === 'hard'
                    ? isSpanish
                      ? 'Es muy difícil para mí'
                      : 'This is too hard for me'
                    : isSpanish
                      ? 'Bajar a fácil'
                      : 'Lower to easy'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {false &&
          activeDifficulty !== 'easy' &&
          lowerLevelAvailable &&
          !roundExhausted &&
          !missionCompleted && (
            <TouchableOpacity
              style={[
                styles.giveUpBtn,
                styles.persistedGiveUpBtn,
              ]}
              onPress={() => setGiveUpVisible(true)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.giveUpText,
                  {
                    color:
                      colors.textMuted,
                  },
                ]}
              >
                {activeDifficulty === 'hard'
                  ? isSpanish
                    ? 'Es muy difícil para mí'
                    : 'This is too hard for me'
                  : isSpanish
                    ? 'Bajar a fácil'
                    : 'Lower to easy'}
              </Text>
            </TouchableOpacity>
          )}
      </View>
    </SafeAreaView>
  );
}

export default function ObjectRecognitionMissionScreen({
  navigation,
  route,
}: Props) {
  return (
    <ObjectRecognitionMissionContent
      difficulty={route.params?.difficulty}
      targetObjectIds={
        route.params?.targetObjectIds
      }
      alarmLabel={route.params?.alarmLabel}
      onBack={() => navigation.goBack()}
      onComplete={() =>
        navigation.navigate('MissionSelector')
      }
    />
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  permissionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.screenPadding,
    gap: 16,
  },

  content: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 32,
    gap: 18,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },

  badge: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  timeBlock: {
    alignItems: 'center',
    paddingVertical: 2,
  },

  time: {
    fontWeight: '500',
    letterSpacing: -1,
    lineHeight: 56,
  },

  dateLabel: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '700',
    textAlign: 'center',
  },

  cameraCard: {
    flex: 1,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderColor: Colors.primary + '55',
    backgroundColor: Colors.black,
    overflow: 'hidden',
    minHeight: 340,
  },

  camera: {
    flex: 1,
  },

  failedPhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 16,
  },

  detectionOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  detectionBox: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 8,
  },

  detectionLabel: {
    position: 'absolute',
    left: -3,
    top: -3,
    minHeight: 29,
    maxWidth: 190,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
    justifyContent: 'center',
  },

  detectionLabelText: {
    fontSize: 13,
    fontWeight: '800',
  },

  failedPhotoMessage: {
    minHeight: 46,
    maxWidth: '94%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.danger,
    backgroundColor: 'rgba(130, 28, 28, 0.88)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  failedPhotoText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },

  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
  },

  scanFrame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },

  cameraCaptureBtn: {
    width: 68,
    height: 68,
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 7,
    overflow: 'hidden',
  },

  cameraCaptureFill: {
    ...StyleSheet.absoluteFillObject,
  },

  cameraCaptureHalo: {
    width: 76,
    height: 76,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },

  targetInfo: {
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },

  title: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },

  targetTitleRow: {
    width: '100%',
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },

  targetChangeBtn: {
    minHeight: 30,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  targetChangeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  objectActionRow: {
    width: '100%',
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingLeft: 36,
    paddingRight: 6,
  },

  objectName: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    flexShrink: 1,
  },

  progressText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },

  note: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },

  analyzingText: {
    fontWeight: '700',
    textShadowOffset: {
      width: 0,
      height: 0,
    },
    textShadowRadius: 8,
  },

  inlineActionBtn: {
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },

  inlineActionText: {
    fontSize: 13,
    fontWeight: '800',
  },

  roundActions: {
    gap: 4,
  },

  giveUpBtn: {
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  giveUpText: {
    fontSize: 12,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },

  persistedGiveUpBtn: {
    marginTop: -14,
  },

  completeBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabledBtn: {
    opacity: 0.6,
  },

  completeText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },

  actionBtn: {
    flex: 1,
  },

  secondaryBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
  },

  secondaryText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.screenPadding,
  },

  successModal: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderColor: Colors.primary + '66',
    backgroundColor: Colors.bgCard,
    padding: 18,
    alignItems: 'center',
    gap: 10,
  },

  successIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  modalTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },

  modalObject: {
    color: Colors.primary,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },

  modalPhoto: {
    width: '100%',
    height: 205,
    borderRadius: 10,
    backgroundColor: Colors.black,
    overflow: 'hidden',
  },

  modalPhotoImage: {
    width: '100%',
    height: '100%',
  },

  modalNote: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },

  modalBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
});
