import React, { useCallback, useEffect, useState } from 'react';
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
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BackButton } from '../../../../shared/components/ui/BackButton';
import { Colors } from '../../../../shared/theme/colors';
import { Layout } from '../../../../shared/theme/layout';
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

type ObjectDifficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_QUANTITY: Record<ObjectDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

function pickRandomObjects(
  objects: RecognizableObject[],
  quantity: number,
): RecognizableObject[] {
  return [...objects]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(quantity, objects.length));
}

export default function ObjectRecognitionMissionScreen({
  navigation,
  route,
}: Props) {
  const cameraRef = React.useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { config, detector } = useObjectRecognitionStore();
  const difficulty = route.params?.difficulty ?? config.difficulty;
  const targetObjectIds = route.params?.targetObjectIds ?? config.targetObjectIds;
  const [targetObjects, setTargetObjects] = useState<RecognizableObject[]>([]);
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [recognitionResult, setRecognitionResult] =
    useState<ObjectRecognitionResult | null>(null);
  const targetObject = targetObjects[currentTargetIndex] ?? null;
  const isLastTarget = currentTargetIndex >= targetObjects.length - 1;

  useEffect(() => {
    const objectPool = ObjectBankService.getEnabled();
    const selectedPool = objectPool.filter(object => targetObjectIds.includes(object.id));
    const pool = selectedPool.length > 0 ? selectedPool : objectPool;
    const quantity = DIFFICULTY_QUANTITY[difficulty];

    setTargetObjects(pickRandomObjects(pool, quantity));
    setCurrentTargetIndex(0);
    setPhoto(null);
    setRecognitionResult(null);
  }, [difficulty, targetObjectIds]);

  const validatePhoto = useCallback(
    async (picture: CameraCapturedPicture) => {
      if (!targetObject || validating || !detector.isReady) return;

      setValidating(true);
      try {
        const detections = await detector.forward(picture.uri, {
          detectionThreshold: Math.max(targetObject.minConfidence - 0.15, 0.25),
          inputSize: 640,
          classesOfInterest: [targetObject.modelLabel as never],
        });
        const result = await ObjectRecognitionService.validateObject({
          detections,
          targetObject,
        });
        setRecognitionResult(result);
      } catch (error) {
        console.log('[ObjectRecognitionMission] No se pudo validar el objeto:', error);
      } finally {
        setValidating(false);
      }
    },
    [detector, targetObject, validating],
  );

  useEffect(() => {
    if (photo && detector.isReady && !validating && !recognitionResult) {
      void validatePhoto(photo);
    }
  }, [detector.isReady, photo, recognitionResult, validatePhoto, validating]);

  const takePhoto = async () => {
    if (!cameraRef.current || !cameraReady || capturing || !targetObject) return;

    setCapturing(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: false,
      });
      setPhoto(picture);
      setRecognitionResult(null);
    } catch (error) {
      console.log('[ObjectRecognitionMission] No se pudo tomar la foto:', error);
    } finally {
      setCapturing(false);
    }
  };

  if (!permission) {
    return <SafeAreaView style={styles.safe} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
        <View style={styles.permissionContent}>
          <Ionicons name="camera-outline" size={58} color={Colors.missionColors.photo} />
          <Text style={styles.title}>Permiso de camara</Text>
          <Text style={styles.note}>
            Necesitamos usar la camara para iniciar la mision de objetos.
          </Text>
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={requestPermission}
            activeOpacity={0.85}
          >
            <Text style={styles.completeText}>Permitir camara</Text>
          </TouchableOpacity>
          <BackButton onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <Modal
        visible={Boolean(recognitionResult?.matched)}
        transparent
        animationType="fade"
        onRequestClose={() => navigation.navigate('MissionSelector')}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={38} color={Colors.white} />
            </View>
            <Text style={styles.modalTitle}>
              {isLastTarget ? 'Mision completada' : 'Objeto reconocido'}
            </Text>
            <Text style={styles.modalObject}>{targetObject?.label ?? 'Objeto'}</Text>
            <Text style={styles.modalNote}>
              {currentTargetIndex + 1} de {targetObjects.length} - Confianza{' '}
              {Math.round((recognitionResult?.confidence ?? 0) * 100)}%
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                if (isLastTarget) {
                  navigation.navigate('MissionSelector');
                  return;
                }

                setCurrentTargetIndex(index => index + 1);
                setPhoto(null);
                setRecognitionResult(null);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnText}>
                {isLastTarget ? 'Aceptar' : 'Siguiente objeto'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={styles.content}>
        <BackButton onPress={() => navigation.goBack()} />

        <View style={styles.cameraCard}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.camera} resizeMode="cover" />
          ) : (
            <>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="back"
                onCameraReady={() => setCameraReady(true)}
              />
              <View style={styles.cameraOverlay}>
                <View style={styles.scanFrame} />
              </View>
            </>
          )}
        </View>

        <View style={styles.targetInfo}>
          <Text style={styles.title}>Busca este objeto</Text>
          <Text style={styles.objectName}>{targetObject?.label ?? 'Objeto'}</Text>
          <Text style={styles.progressText}>
            {targetObjects.length > 0
              ? `${currentTargetIndex + 1} de ${targetObjects.length}`
              : 'Sin objetos'}
          </Text>
          <Text style={styles.note}>
            {recognitionResult
              ? `Detectado: ${recognitionResult.detectedLabel} (${Math.round(
                  recognitionResult.confidence * 100,
                )}%)`
              : validating
                ? 'Analizando la foto...'
                : detector.error
                ? 'No se pudo cargar el modelo local de reconocimiento.'
                : !detector.isReady
                  ? `Preparando IA local ${Math.round(
                      detector.downloadProgress * 100,
                    )}%`
                  : 'Toma una foto y valida el objeto antes de completar.'}
          </Text>
        </View>

        {photo ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                setPhoto(null);
                setRecognitionResult(null);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryText}>Repetir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.completeBtn,
                styles.actionBtn,
                (validating || !detector.isReady || recognitionResult?.matched) &&
                  styles.disabledBtn,
              ]}
              onPress={() => {
                if (photo) void validatePhoto(photo);
              }}
              activeOpacity={0.85}
              disabled={validating || !detector.isReady || recognitionResult?.matched}
            >
              <Text style={styles.completeText}>
                {validating
                  ? 'Analizando...'
                  : detector.isReady
                    ? 'Reintentar'
                    : 'Cargando IA'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.completeBtn,
              (!cameraReady || capturing || !targetObject) && styles.disabledBtn,
            ]}
            onPress={takePhoto}
            activeOpacity={0.85}
            disabled={!cameraReady || capturing || !targetObject}
          >
            <Text style={styles.completeText}>
              {capturing ? 'Capturando...' : 'Tomar foto'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
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
    borderColor: Colors.missionColors.photo + '55',
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
    borderColor: Colors.missionColors.photo,
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
    color: Colors.missionColors.photo,
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
    backgroundColor: Colors.missionColors.photo,
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
    borderColor: Colors.missionColors.photo,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
  },
  secondaryText: {
    color: Colors.missionColors.photo,
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
    borderColor: Colors.missionColors.photo + '66',
    backgroundColor: Colors.bgCard,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  successIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.missionColors.photo,
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
    color: Colors.missionColors.photo,
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
    backgroundColor: Colors.missionColors.photo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
});
