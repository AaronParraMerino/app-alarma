import Constants from 'expo-constants';
import type * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alarm, RepeatDay } from '../types/alarm.types';
import { DEFAULT_ALARM_SOUND_URI } from './alarmService';

type NotificationLike = {
  notification?: {
    request?: {
      content?: {
        data?: Record<string, unknown>;
      };
    };
  };
  request?: {
    content?: {
      data?: Record<string, unknown>;
    };
  };
};

const ALARM_CHANNEL_ID = 'alarms-default';
const SILENT_CHANNEL_ID = 'alarms-silent';

function isExpoGoRuntime(): boolean {
  return Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';
}

async function getNotificationsModule(): Promise<typeof ExpoNotifications | null> {
  try {
    return await import('expo-notifications');
  } catch (error) {
    console.log('[AlarmScheduler] Unable to load notifications module:', error);
    return null;
  }
}

const alarmData = (alarmId: string) => ({ alarmId, type: 'alarm' as const });

function normalizeSoundUri(soundUri: string | null): string | null {
  if (!soundUri) return null;
  if (soundUri.includes('://')) return DEFAULT_ALARM_SOUND_URI;
  return soundUri;
}

function getSoundResourceName(soundUri: string | null): string | null {
  const normalizedSoundUri = normalizeSoundUri(soundUri);
  if (!normalizedSoundUri) return null;
  return normalizedSoundUri.replace(/\.[^/.]+$/, '');
}

function getAlarmChannelId(soundUri: string | null): string {
  const soundResourceName = getSoundResourceName(soundUri);
  return soundResourceName ? `alarms-${soundResourceName}` : SILENT_CHANNEL_ID;
}

function getNotificationSound(soundUri: string | null): string | false {
  return normalizeSoundUri(soundUri) ?? false;
}

async function ensureAlarmChannelAsync(
  Notifications: typeof ExpoNotifications,
  soundUri: string | null,
): Promise<string> {
  const channelId = getAlarmChannelId(soundUri);

  if (Platform.OS !== 'android') return channelId;

  await Notifications.setNotificationChannelAsync(channelId, {
    name: soundUri ? 'Alarmas con sonido' : 'Alarmas silenciosas',
    importance: Notifications.AndroidImportance.MAX,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
    sound: getSoundResourceName(soundUri),
    bypassDnd: true,
  });

  return channelId;
}

function toExpoWeekday(day: RepeatDay): number {
  return day + 1;
}

function nextDate(hour: number, minute: number): Date {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

async function scheduleOneTimeAlarm(alarm: Alarm): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const channelId = await ensureAlarmChannelAsync(Notifications, alarm.soundUri);
  const triggerDate = nextDate(alarm.hour, alarm.minute);
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: alarm.label || 'Alarma',
      body: 'Desliza para apagar',
      sound: getNotificationSound(alarm.soundUri),
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: alarmData(alarm.id),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextDate(alarm.hour, alarm.minute),
      channelId,
    },
  });

  console.log(
    `[AlarmScheduler] Alarma ${alarm.id} programada para ${triggerDate.toISOString()} (${identifier})`,
  );
}

async function scheduleRepeatAlarm(alarm: Alarm, repeatDays: RepeatDay[]): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const channelId = await ensureAlarmChannelAsync(Notifications, alarm.soundUri);

  for (const day of repeatDays) {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: alarm.label || 'Alarma',
        body: 'Desliza para apagar',
        sound: getNotificationSound(alarm.soundUri),
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: alarmData(alarm.id),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        channelId,
        weekday: toExpoWeekday(day),
        hour: alarm.hour,
        minute: alarm.minute,
      },
    });

    console.log(
      `[AlarmScheduler] Alarma ${alarm.id} repetida dia ${day} programada (${identifier})`,
    );
  }
}

export async function setupAlarmNotificationsAsync(): Promise<void> {
  if (isExpoGoRuntime()) {
    console.log('[AlarmScheduler] Expo Go/runtime Expo detectado; se intentara usar notificaciones locales.');
  }

  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const { status } = await Notifications.getPermissionsAsync();
    let finalStatus = status;
    if (finalStatus !== 'granted') {
      const request = await Notifications.requestPermissionsAsync();
      finalStatus = request.status;
    }

    if (finalStatus !== 'granted') {
      console.log('[AlarmScheduler] Permiso de notificaciones denegado.');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
        name: 'Alarmas',
        importance: Notifications.AndroidImportance.MAX,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
        bypassDnd: true,
      });
    }

    console.log('[AlarmScheduler] Notificaciones listas.');
  } catch (error) {
    console.log('[AlarmScheduler] Notifications not available in this runtime:', error);
  }
}

export async function cancelAlarmNotificationsByAlarmId(alarmId: string): Promise<void> {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const alarmNotifications = scheduled.filter(
      item => String(item.content.data?.alarmId ?? '') === alarmId,
    );

    for (const item of alarmNotifications) {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
  } catch (error) {
    console.log('[AlarmScheduler] Cancel skipped:', error);
  }
}

export async function scheduleAlarmNotifications(alarm: Alarm): Promise<void> {
  try {
    await setupAlarmNotificationsAsync();
    await cancelAlarmNotificationsByAlarmId(alarm.id);

    if (!alarm.enabled) return;

    if (alarm.repeatDays.length === 0) {
      await scheduleOneTimeAlarm(alarm);
      return;
    }

    await scheduleRepeatAlarm(alarm, alarm.repeatDays);
  } catch (error) {
    console.log('[AlarmScheduler] Schedule skipped:', error);
  }
}

export function extractAlarmIdFromNotification(
  notification: NotificationLike,
): string | null {
  const data = notification.notification?.request?.content?.data
    ?? notification.request?.content?.data;
  const raw = data?.alarmId;
  if (!raw) return null;
  return String(raw);
}

export { isExpoGoRuntime };
