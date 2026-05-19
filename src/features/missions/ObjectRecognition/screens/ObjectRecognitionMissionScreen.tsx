import React, { useEffect, useState } from 'react';
import {
  Image,
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
import {
  useObjectDetection,
  YOLO26X,
} from 'react-native-executorch';
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

export default function ObjectRecognitionMissionScreen({
  navigation,
  route,
}: Props) {
  const detector = useObjectDetection({
    model: YOLO26X,
  });
  const cameraRef = React.useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { config } = useObjectRecognitionStore();
  const targetObjectId = route.params?.targetObjectId ?? config.targetObjectId;
  const [targetObject, setTargetObject] = useState<RecognizableObject | null>(null);
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [recognitionResult, setRecognitionResult] =
    useState<ObjectRecognitionResult | null>(null);

  useEffect(() => {
    setTargetObject(ObjectBankService.getById(targetObjectId));
  }, [targetObjectId]);

  const takePhoto = async () => {
    if (!cameraRef.current || !cameraReady || capturing) return;

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

  const validatePhoto = async () => {
    if (!photo || !targetObject || validating || !detector.isReady) return;

    setValidating(true);
    try {
      const detections = await detector.forward(photo.uri, {
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
          <Text style={styles.note}>
            {recognitionResult
              ? `Detectado: ${recognitionResult.detectedLabel} (${Math.round(
                  recognitionResult.confidence * 100,
                )}%)`
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
            {recognitionResult?.matched ? (
              <TouchableOpacity
                style={[styles.completeBtn, styles.actionBtn]}
                onPress={() => navigation.navigate('MissionSelector')}
                activeOpacity={0.85}
              >
                <Text style={styles.completeText}>Completar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.completeBtn,
                  styles.actionBtn,
                  (validating || !detector.isReady) && styles.disabledBtn,
                ]}
                onPress={validatePhoto}
                activeOpacity={0.85}
                disabled={validating || !detector.isReady}
              >
                <Text style={styles.completeText}>
                  {validating
                    ? 'Validando...'
                    : detector.isReady
                      ? 'Validar'
                      : 'Cargando IA'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.completeBtn, (!cameraReady || capturing) && styles.disabledBtn]}
            onPress={takePhoto}
            activeOpacity={0.85}
            disabled={!cameraReady || capturing}
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
});
