import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Alarm, RepeatDay } from '../types/alarm.types';

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

function isExpoGoRuntime(): boolean {
  return Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';
}

async function getNotificationsModule(): Promise<any | null> {
  if (isExpoGoRuntime()) {
    return null;
  }

  try {
    return await import('expo-notifications');
  } catch (error) {
    console.log('[AlarmScheduler] Unable to load notifications module:', error);
    return null;
  }
}

const alarmData = (alarmId: string) => ({ alarmId, type: 'alarm' as const });

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

  await Notifications.scheduleNotificationAsync({
    content: {
      title: alarm.label || 'Alarma',
      body: 'Desliza para apagar',
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: alarmData(alarm.id),
    },
    trigger: nextDate(alarm.hour, alarm.minute),
  });
}

async function scheduleRepeatAlarm(alarm: Alarm, repeatDays: RepeatDay[]): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  for (const day of repeatDays) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: alarm.label || 'Alarma',
        body: 'Desliza para apagar',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: alarmData(alarm.id),
      },
      trigger: {
        weekday: toExpoWeekday(day),
        hour: alarm.hour,
        minute: alarm.minute,
        repeats: true,
      },
    });
  }
}

export async function setupAlarmNotificationsAsync(): Promise<void> {
  if (isExpoGoRuntime()) {
    console.log('[AlarmScheduler] Expo Go detected: notifications disabled.');
    return;
  }

  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('alarms', {
        name: 'Alarmas',
        importance: Notifications.AndroidImportance.MAX,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
        sound: 'default',
        bypassDnd: true,
      });
    }
  } catch (error) {
    console.log('[AlarmScheduler] Notifications not available in this runtime:', error);
  }
}

export async function cancelAlarmNotificationsByAlarmId(alarmId: string): Promise<void> {
  if (isExpoGoRuntime()) return;

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
  if (isExpoGoRuntime()) return;

  try {
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
