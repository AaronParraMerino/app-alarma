import React from 'react';
import { StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MissionsStackParamList } from '../../navigation/MissionsNavigator';
import { WordCompletionMission } from '../components/WordCompletionMission';

type Props = NativeStackScreenProps<MissionsStackParamList, 'WordCompletionMissionScreen'>;

export default function WordCompletionMissionScreen({ navigation, route }: Props) {
  const { difficulty, quantity, alarmLabel } = route.params;

  return (
    <WordCompletionMission
      difficulty={difficulty}
      quantity={quantity}
      onComplete={() => navigation.goBack()}
      alarmLabel={alarmLabel}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: '#0D0D0D' },
  pill: {
    alignSelf: 'center', marginTop: 16,
    paddingVertical: 5, paddingHorizontal: 18,
    borderRadius: 20, borderWidth: 0.5,
  },
  pillText: { fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  timeBlock: { alignItems: 'center', paddingVertical: 10 },
  time: { fontWeight: '500', color: '#FFFFFF', letterSpacing: -1, lineHeight: 56 },
  dateLabel: { fontSize: 12, color: '#556677', marginTop: 2 },
  divider: { height: 0.5, backgroundColor: '#1E1E1E', marginHorizontal: 16, marginVertical: 10 },
  body: { flex: 1, paddingHorizontal: 18, paddingBottom: 16 },
  instruction: { fontSize: 12, color: '#667788', marginBottom: 12 },
  wordBox: {
    backgroundColor: '#161616', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 10,
    alignItems: 'center', marginBottom: 12,
  },
  input: {
    backgroundColor: '#161616', borderWidth: 0.5, borderRadius: 10,
    height: 52, textAlign: 'center', fontWeight: '500',
    fontFamily: 'monospace', marginBottom: 6,
  },
  errorText: { fontSize: 11, color: '#F87171', textAlign: 'center', marginBottom: 4 },
  hint: { fontSize: 11, textAlign: 'center', marginBottom: 12 },
  confirmBtn: {
    borderRadius: 14, height: 50,
    alignItems: 'center', justifyContent: 'center', marginTop: 'auto',
  },
  confirmText: { fontSize: 15, fontWeight: '500' },
  skipBtn: { alignItems: 'center', marginTop: 8, paddingBottom: 4 },
  skipText: { fontSize: 11, color: '#334455', textDecorationLine: 'underline' },
  progressBar: {
    backgroundColor: '#0D0D0D',
    borderTopWidth: 0.5, borderTopColor: '#1E1E1E',
    paddingVertical: 8, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  progressText: { fontSize: 12 },
});
