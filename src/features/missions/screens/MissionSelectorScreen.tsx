import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MissionsStackParamList } from '../navigation/MissionsNavigator';
import { useWordCompletionStore } from '../wordCompletion/store/wordCompletionStore';
import { DIFFICULTY_STYLES } from '../wordCompletion/constants/wordCompletion.config';

type NavigationProp = NativeStackNavigationProp<MissionsStackParamList, 'MissionSelector'>;

export default function MissionSelectorScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { config } = useWordCompletionStore();
  const diffStyle = DIFFICULTY_STYLES[config.difficulty];

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Selecciona una misión</Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate('ConfigWordCompletionMission', {})}
      >
        <Text style={styles.btnText}>Configurar misión de palabras</Text>
      </TouchableOpacity>

      <Text style={styles.summary}>
        {diffStyle.label}  ·  {config.quantity} vez{config.quantity > 1 ? 'es' : ''}
      </Text>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: diffStyle.bgColor, borderColor: diffStyle.accentColor + '50', borderWidth: 0.5 }]}
        onPress={() =>
          navigation.navigate('WordCompletionMissionScreen', {
            difficulty: config.difficulty,
            quantity:   config.quantity,
          })
        }
      >
        <Text style={[styles.btnText, { color: diffStyle.accentColor }]}>
          Ejecutar misión de palabras
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1, backgroundColor: '#0D0D0D',
    paddingHorizontal: 20, justifyContent: 'center', gap: 12,
  },
  title: {
    fontSize: 20, fontWeight: '500', color: '#FFFFFF',
    marginBottom: 8, textAlign: 'center',
  },
  btn: {
    backgroundColor: '#1A6EF5', borderRadius: 14,
    height: 52, alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  summary: { fontSize: 12, color: '#556677', textAlign: 'center' },
});
