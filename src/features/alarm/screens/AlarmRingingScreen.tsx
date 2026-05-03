import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  PanResponder,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../../shared/theme/colors';
import { cancelAlarmNotificationsByAlarmId } from '../services/alarmScheduler';
import { useAlarmStore } from '../store/alarmStore';
import { AlarmStackParamList } from '../navigation/AlarmNavigator';

type Props = NativeStackScreenProps<AlarmStackParamList, 'AlarmRinging'>;

function formatTime(hour: number, minute: number): string {
  const hh = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${hh.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

export default function AlarmRingingScreen({ route, navigation }: Props) {
  const { alarms, updateAlarm } = useAlarmStore();
  const alarm = alarms.find(a => a.id === route.params.alarmId);

  const { width } = useWindowDimensions();
  const trackWidth = Math.max(220, width - 56);
  const knobSize = 56;
  const maxTranslate = trackWidth - knobSize - 8;

  const dragX = useRef(new Animated.Value(0)).current;
  const currentXRef = useRef(0);
  const [completed, setCompleted] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => subscription.remove();
    }, []),
  );

  const stopAlarm = React.useCallback(async () => {
    if (!alarm) {
      navigation.goBack();
      return;
    }

    await cancelAlarmNotificationsByAlarmId(alarm.id);

    if (alarm.repeatDays.length === 0) {
      updateAlarm(alarm.id, { enabled: false });
    }

    navigation.goBack();
  }, [alarm, navigation, updateAlarm]);

  const completeMission = React.useCallback(() => {
    if (completed) return;
    setCompleted(true);
    void stopAlarm();
  }, [completed, stopAlarm]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 6,
        onPanResponderMove: (_, gesture) => {
          const next = Math.min(Math.max(currentXRef.current + gesture.dx, 0), maxTranslate);
          dragX.setValue(next);
        },
        onPanResponderRelease: (_, gesture) => {
          const next = Math.min(Math.max(currentXRef.current + gesture.dx, 0), maxTranslate);
          const reached = next >= maxTranslate * 0.9;

          if (reached) {
            Animated.timing(dragX, {
              toValue: maxTranslate,
              duration: 120,
              useNativeDriver: true,
            }).start(() => {
              currentXRef.current = maxTranslate;
              completeMission();
            });
            return;
          }

          Animated.spring(dragX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
            speed: 16,
          }).start(() => {
            currentXRef.current = 0;
          });
        },
      }),
    [completeMission, dragX, maxTranslate],
  );

  if (!alarm) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.title}>Alarma no encontrada</Text>
          <Text style={styles.subtitle}>Vuelve e intenta de nuevo.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'right', 'left', 'bottom']}>
      <View style={styles.topSection}>
        <Text style={styles.badge}>ALARMA ACTIVA</Text>
        <Text style={styles.time}>{formatTime(alarm.hour, alarm.minute)}</Text>
        <Text style={styles.label}>{alarm.label || 'Hora de despertar'}</Text>
      </View>

      <View style={styles.missionSection}>
        <View style={styles.missionCard}>
          <Text style={styles.missionTitle}>Misión actual</Text>
          <Text style={styles.missionSubtitle}>Desliza para apagar la alarma</Text>

          <View style={[styles.track, { width: trackWidth }]}>
            <Text style={styles.trackHint}>Desliza</Text>
            <Animated.View
              style={[
                styles.knob,
                {
                  transform: [{ translateX: dragX }],
                },
              ]}
              {...panResponder.panHandlers}
            >
              <Text style={styles.knobText}>➤</Text>
            </Animated.View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#06080E',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  topSection: {
    flex: 1,
    minHeight: 110,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#0A0F1A',
    paddingHorizontal: 20,
  },
  missionSection: {
    flex: 5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  badge: {
    color: Colors.warning,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  time: {
    color: Colors.text,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1.2,
    lineHeight: 54,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  missionCard: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#101727',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1A2741',
    padding: 18,
    alignItems: 'center',
  },
  missionTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  missionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 24,
  },
  track: {
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0A1323',
    borderWidth: 1,
    borderColor: '#243556',
    justifyContent: 'center',
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  trackHint: {
    color: '#7892C0',
    alignSelf: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  knob: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  knobText: {
    color: Colors.white,
    fontSize: 20,
  },
});
