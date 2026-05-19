import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
  const { config } = useObjectRecognitionStore();
  const targetObjectId = route.params?.targetObjectId ?? config.targetObjectId;
  const [targetObject, setTargetObject] = useState<RecognizableObject | null>(null);

  useEffect(() => {
    setTargetObject(ObjectBankService.getById(targetObjectId));
  }, [targetObjectId]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.content}>
        <BackButton onPress={() => navigation.goBack()} />

        <View style={styles.targetBox}>
          <Ionicons name="scan-outline" size={68} color={Colors.missionColors.photo} />
          <Text style={styles.title}>Busca este objeto</Text>
          <Text style={styles.objectName}>{targetObject?.label ?? 'Objeto'}</Text>
          <Text style={styles.note}>
            Esta es la base de la mision. En el siguiente paso conectamos camara o
            reconocimiento real.
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
  content: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 32,
    gap: 18,
  },
  targetBox: {
    flex: 1,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderColor: Colors.missionColors.photo + '55',
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
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
