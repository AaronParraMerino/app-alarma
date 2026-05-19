import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BackButton } from '../../../../shared/components/ui/BackButton';
import { Colors } from '../../../../shared/theme/colors';
import { Layout } from '../../../../shared/theme/layout';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { ObjectBankService } from '../services/objectBank.service';
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
  const [permission, requestPermission] = useCameraPermissions();
  const { config } = useObjectRecognitionStore();
  const targetObjectId = route.params?.targetObjectId ?? config.targetObjectId;
  const [targetObject, setTargetObject] = useState<RecognizableObject | null>(null);

  useEffect(() => {
    setTargetObject(ObjectBankService.getById(targetObjectId));
  }, [targetObjectId]);

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
          <CameraView style={styles.camera} facing="back" />
          <View style={styles.cameraOverlay}>
            <View style={styles.scanFrame} />
          </View>
        </View>

        <View style={styles.targetInfo}>
          <Text style={styles.title}>Busca este objeto</Text>
          <Text style={styles.objectName}>{targetObject?.label ?? 'Objeto'}</Text>
          <Text style={styles.note}>
            Por ahora esta pantalla valida el flujo de camara. Luego conectamos
            reconocimiento automatico.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.completeBtn}
          onPress={() => navigation.navigate('MissionSelector')}
          activeOpacity={0.85}
        >
          <Text style={styles.completeText}>Completar prueba</Text>
        </TouchableOpacity>
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
  completeText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
