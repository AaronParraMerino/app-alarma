// src/features/missions/ObjectRecognition/screens/ObjectRecognitionMissionScreen.tsx
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  Image,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
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
import { Colors } from '../../../../shared/theme/colors';
import { Layout } from '../../../../shared/theme/layout';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../../shared/i18n/useTranslation';
import { MissionCompleteModal } from '../../../../shared/components/missions/MissionCompleteModal';
import { MissionErrorCounter } from '../../../../shared/components/missions/MissionErrorCounter';

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

const DIFFICULTY_QUANTITY: Record<
  ObjectDifficulty,
  number
> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const LOWER_DIFFICULTY: Record<
  ObjectDifficulty,
  ObjectDifficulty
> = {
  easy: 'easy',
  medium: 'easy',
  hard: 'medium',
};

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

function pickRandomObjects(
  objects: RecognizableObject[],
  quantity: number,
): RecognizableObject[] {
  return [...objects]
    .sort(() => Math.random() - 0.5)
    .slice(
      0,
      Math.min(
        quantity,
        objects.length,
      ),
    );
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
      ? 'NORMAL'
      : 'NORMAL';
  }

  return isSpanish
    ? 'DIFÍCIL'
    : 'HARD';
}

type ObjectRecognitionMissionContentProps = {
  difficulty?: ObjectDifficulty;
  targetObjectIds?: string[];
  alarmLabel?: string;
  onBack?: () => void;
  onComplete?: () => void;
};

export function ObjectRecognitionMissionContent({
  difficulty,
  targetObjectIds: routeTargetObjectIds,
  onBack,
  onComplete,
}: ObjectRecognitionMissionContentProps) {
  const {
    colors,
    statusBarStyle,
  } = useAppTheme();

  const {
    language,
  } = useTranslation();

  const isSpanish =
    language === 'es';

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

  const targetObject =
    targetObjects[currentTargetIndex] ?? null;

  const isLastTarget =
    currentTargetIndex >=
    targetObjects.length - 1;

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

    const quantity =
      DIFFICULTY_QUANTITY[initialDifficulty];

    setActiveDifficulty(initialDifficulty);
    setObjectPool(pool);
    setTargetObjects(
      pickRandomObjects(
        pool,
        quantity,
      ),
    );
    setCurrentTargetIndex(0);
    setFailedAttempts(0);
    setPhoto(null);
    setRecognitionResult(null);
  }, [
    initialDifficulty,
    targetObjectIds,
  ]);

  const changeTargetAfterFailures =
    useCallback(() => {
      const nextDifficulty =
        LOWER_DIFFICULTY[activeDifficulty];

      const replacement =
        pickReplacementObject(
          objectPool,
          targetObject?.id,
        );

      setActiveDifficulty(nextDifficulty);
      setFailedAttempts(0);
      setPhoto(null);
      setRecognitionResult(null);

      if (!replacement) {
        return;
      }

      setTargetObjects((current) => {
        const desiredTotal =
          Math.max(
            DIFFICULTY_QUANTITY[nextDifficulty],
            currentTargetIndex + 1,
          );

        const nextObjects = [
          ...current,
        ];

        nextObjects[currentTargetIndex] =
          replacement;

        return nextObjects.slice(
          0,
          desiredTotal,
        );
      });
    }, [
      activeDifficulty,
      currentTargetIndex,
      objectPool,
      targetObject?.id,
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
              classesOfInterest: [
                targetObject.modelLabel as never,
              ],
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

          if (nextFailedAttempts >= 3) {
            changeTargetAfterFailures();

            return;
          }

          setFailedAttempts(
            nextFailedAttempts,
          );
        } else {
          setFailedAttempts(0);
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
      changeTargetAfterFailures,
      detector,
      failedAttempts,
      targetObject,
      validating,
    ],
  );

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

  const takePhoto = async () => {
    if (
      !cameraRef.current ||
      !cameraReady ||
      capturing ||
      !targetObject
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

          <BackButton
            label={
              isSpanish
                ? 'Volver'
                : 'Back'
            }
            onPress={onBack ?? (() => {})}
          />
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

  const detectedLabel =
    recognitionResult?.detectedLabel
      ? translateObjectLabel(
          recognitionResult.detectedLabel,
          isSpanish,
        )
      : '';

  const noteText =
    recognitionResult
      ? isSpanish
        ? `Detectado: ${detectedLabel} (${Math.round(
            recognitionResult.confidence * 100,
          )}%)`
        : `Detected: ${detectedLabel} (${Math.round(
            recognitionResult.confidence * 100,
          )}%)`
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
            : failedAttempts > 0
              ? isSpanish
                ? `Intentos fallidos ${failedAttempts}/3. Toma otra foto.`
                : `Failed attempts ${failedAttempts}/3. Take another photo.`
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
          recognitionResult?.matched && !isLastTarget,
        )}
        transparent
        animationType="fade"
        onRequestClose={handleComplete}
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
              {isLastTarget
                ? isSpanish
                  ? 'Misión completada'
                  : 'Mission completed'
                : isSpanish
                  ? 'Objeto reconocido'
                  : 'Object recognized'}
            </Text>

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
                ? `${currentTargetIndex + 1} de ${
                    targetObjects.length
                  } - Confianza ${Math.round(
                    (recognitionResult?.confidence ??
                      0) * 100,
                  )}%`
                : `${currentTargetIndex + 1} of ${
                    targetObjects.length
                  } - Confidence ${Math.round(
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
                if (isLastTarget) {
                  handleComplete();

                  return;
                }

                setCurrentTargetIndex(
                  (index) => index + 1,
                );
                setFailedAttempts(0);
                setPhoto(null);
                setRecognitionResult(null);
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
                {isLastTarget
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

      <MissionCompleteModal
        visible={Boolean(recognitionResult?.matched && isLastTarget)}
        completedCount={targetObjects.length}
        totalCount={targetObjects.length}
        onContinue={handleComplete}
      />

      <View style={styles.content}>
        <BackButton
          label={
            isSpanish
              ? 'Volver'
              : 'Back'
          }
          onPress={onBack ?? (() => {})}
        />

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
            <Image
              source={{
                uri: photo.uri,
              }}
              style={styles.camera}
              resizeMode="cover"
            />
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
          <Text style={styles.title}>
            {isSpanish
              ? 'Busca este objeto'
              : 'Find this object'}
          </Text>

          <Text style={styles.objectName}>
            {targetObjectName}
          </Text>

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
                ? `${currentTargetIndex + 1} de ${
                    targetObjects.length
                  } - ${getDifficultyLabel(
                    activeDifficulty,
                    true,
                  )}`
                : `${currentTargetIndex + 1} of ${
                    targetObjects.length
                  } - ${getDifficultyLabel(
                    activeDifficulty,
                    false,
                  )}`
              : isSpanish
                ? 'Sin objetos'
                : 'No objects'}
          </Text>

          <Text style={styles.note}>
            {noteText}
          </Text>

          <MissionErrorCounter
            count={failedAttempts}
            max={3}
            color={difficultyStyle.accentColor}
          />
        </View>

        {photo ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                {
                  borderColor:
                    difficultyStyle.accentColor,
                },
              ]}
              onPress={() => {
                setPhoto(null);
                setRecognitionResult(null);
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.secondaryText,
                  {
                    color:
                      difficultyStyle.accentColor,
                  },
                ]}
              >
                {isSpanish
                  ? 'Repetir'
                  : 'Retake'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.completeBtn,
                styles.actionBtn,
                {
                  backgroundColor:
                    difficultyStyle.accentColor,
                },
                (
                  validating ||
                  !detector.isReady ||
                  recognitionResult?.matched
                ) &&
                  styles.disabledBtn,
              ]}
              onPress={() => {
                if (photo) {
                  void validatePhoto(photo);
                }
              }}
              activeOpacity={0.85}
              disabled={
                validating ||
                !detector.isReady ||
                recognitionResult?.matched
              }
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
                {validating
                  ? isSpanish
                    ? 'Analizando...'
                    : 'Analyzing...'
                  : detector.isReady
                    ? isSpanish
                      ? 'Reintentar'
                      : 'Retry'
                    : isSpanish
                      ? 'Cargando IA'
                      : 'Loading AI'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.completeBtn,
              {
                backgroundColor:
                  difficultyStyle.accentColor,
              },
              (
                !cameraReady ||
                capturing ||
                !targetObject
              ) &&
                styles.disabledBtn,
            ]}
            onPress={takePhoto}
            activeOpacity={0.85}
            disabled={
              !cameraReady ||
              capturing ||
              !targetObject
            }
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
              {capturing
                ? isSpanish
                  ? 'Capturando...'
                  : 'Capturing...'
                : isSpanish
                  ? 'Tomar foto'
                  : 'Take photo'}
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

  objectName: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
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
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },

  successIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
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
