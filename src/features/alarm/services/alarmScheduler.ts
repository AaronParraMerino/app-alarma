import Constants from 'expo-constants';
import type * as ExpoNotifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
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

const ALARM_CHANNEL_ID = 'alarms-v2-default';
const SILENT_CHANNEL_ID = 'alarms-v2-silent';
const ALARM_VIBRATION_PATTERN = [0, 500, 350, 500, 350, 900];
const WEEK_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

type NativeAlarmScheduleOptions = {
  alarmId: string;
  scheduleId: string;
  triggerAtMillis: number;
  repeatIntervalMillis: number;
  label: string;
  soundUri: string | null;
  scheme: string;
};

type NativeAlarmSchedulerModule = {
  isAvailable?: () => Promise<boolean>;
  canUseFullScreenIntent?: () => Promise<boolean>;
  openFullScreenIntentSettings?: () => Promise<void>;
  scheduleAlarm?: (options: NativeAlarmScheduleOptions) => Promise<void>;
  cancelAlarm?: (alarmId: string) => Promise<void>;
  stopAlarm?: (alarmId: string) => Promise<void>;
  getPendingAlarmId?: () => Promise<string | null>;
  closeAlarmScreen?: () => Promise<boolean>;
};

const NativeAlarmScheduler = NativeModules.NeuroWakeAlarmScheduler as
  | NativeAlarmSchedulerModule
  | undefined;
let nativeAlarmAvailabilityLogged = false;
let fullScreenSettingsOpenedThisSession = false;
const RESOLVED_ALARM_STORAGE_KEY = 'neuroWake.resolvedRingingAlarms.v1';
const RESOLVED_ALARM_SUPPRESSION_MS = 4 * 60 * 60 * 1000;
const recentlyResolvedAlarmIds = new Map<string, number>();
let resolvedAlarmCacheLoaded = false;
let resolvedAlarmCachePromise: Promise<void> | null = null;

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

function getAlarmAudioAttributes(Notifications: typeof ExpoNotifications) {
  return {
    usage: Notifications.AndroidAudioUsage.ALARM,
    contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    flags: {
      enforceAudibility: true,
      requestHardwareAudioVideoSynchronization: false,
    },
  };
}

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
  return soundResourceName ? `alarms-v2-${soundResourceName}` : SILENT_CHANNEL_ID;
}

function getNotificationSound(soundUri: string | null, useCustomSound: boolean): string | false {
  if (!soundUri) return false;
  if (!useCustomSound) return 'default';
  return normalizeSoundUri(soundUri) ?? false;
}

export function isNativeAndroidAlarmAvailable(): boolean {
  return Platform.OS === 'android' && typeof NativeAlarmScheduler?.scheduleAlarm === 'function';
}

function pruneResolvedAlarmCache(now = Date.now()): boolean {
  let changed = false;

  recentlyResolvedAlarmIds.forEach((resolvedAt, alarmId) => {
    if (now - resolvedAt > RESOLVED_ALARM_SUPPRESSION_MS) {
      recentlyResolvedAlarmIds.delete(alarmId);
      changed = true;
    }
  });

  return changed;
}

async function persistResolvedAlarmCacheAsync(): Promise<void> {
  const entries = Array.from(recentlyResolvedAlarmIds.entries()).map(
    ([alarmId, resolvedAt]) => ({ alarmId, resolvedAt }),
  );

  if (entries.length === 0) {
    await AsyncStorage.removeItem(RESOLVED_ALARM_STORAGE_KEY);
    return;
  }

  await AsyncStorage.setItem(RESOLVED_ALARM_STORAGE_KEY, JSON.stringify(entries));
}

async function loadResolvedAlarmCacheAsync(): Promise<void> {
  if (resolvedAlarmCacheLoaded) return;
  if (resolvedAlarmCachePromise) return resolvedAlarmCachePromise;

  resolvedAlarmCachePromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(RESOLVED_ALARM_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Array<{ alarmId?: unknown; resolvedAt?: unknown }>;
      if (!Array.isArray(parsed)) return;

      parsed.forEach(item => {
        if (typeof item.alarmId !== 'string' || typeof item.resolvedAt !== 'number') {
          return;
        }

        recentlyResolvedAlarmIds.set(item.alarmId, item.resolvedAt);
      });

      if (pruneResolvedAlarmCache()) {
        await persistResolvedAlarmCacheAsync();
      }
    } catch (error) {
      console.log('[AlarmScheduler] No se pudo cargar cache de alarmas resueltas:', error);
      await AsyncStorage.removeItem(RESOLVED_ALARM_STORAGE_KEY);
    } finally {
      resolvedAlarmCacheLoaded = true;
      resolvedAlarmCachePromise = null;
    }
  })();

  return resolvedAlarmCachePromise;
}

async function markRingingAlarmResolved(alarmId: string): Promise<void> {
  await loadResolvedAlarmCacheAsync();
  recentlyResolvedAlarmIds.set(alarmId, Date.now());
  pruneResolvedAlarmCache();
  await persistResolvedAlarmCacheAsync();
}

async function isRingingAlarmRecentlyResolved(alarmId: string): Promise<boolean> {
  await loadResolvedAlarmCacheAsync();

  const resolvedAt = recentlyResolvedAlarmIds.get(alarmId);
  if (!resolvedAt) return false;

  if (Date.now() - resolvedAt > RESOLVED_ALARM_SUPPRESSION_MS) {
    recentlyResolvedAlarmIds.delete(alarmId);
    await persistResolvedAlarmCacheAsync();
    return false;
  }

  return true;
}

function logNativeAlarmAvailabilityOnce(): void {
  if (Platform.OS !== 'android' || nativeAlarmAvailabilityLogged) return;

  nativeAlarmAvailabilityLogged = true;
  if (isNativeAndroidAlarmAvailable()) {
    console.log('[AlarmScheduler] Modulo nativo Android disponible.');
    return;
  }

  const alarmModuleKeys = Object.keys(NativeModules)
    .filter(key => key.toLowerCase().includes('alarm'))
    .join(', ');

  console.log(
    '[AlarmScheduler] Modulo nativo Android NO disponible; usando fallback de Expo Notifications.',
  );
  console.log(
    `[AlarmScheduler] Modulos nativos relacionados detectados: ${alarmModuleKeys || 'ninguno'}`,
  );
  console.log(
    '[AlarmScheduler] Para pantalla completa y sonido continuo necesitas instalar una dev build/APK generada despues de estos cambios nativos.',
  );
}

export async function canUseNativeAlarmFullScreenIntent(): Promise<boolean> {
  if (!isNativeAndroidAlarmAvailable() || !NativeAlarmScheduler?.canUseFullScreenIntent) {
    return false;
  }

  try {
    return await NativeAlarmScheduler.canUseFullScreenIntent();
  } catch (error) {
    console.log('[AlarmScheduler] No se pudo verificar full-screen intent:', error);
    return true;
  }
}

async function logNativeFullScreenPermissionAsync(): Promise<void> {
  if (!isNativeAndroidAlarmAvailable() || !NativeAlarmScheduler?.canUseFullScreenIntent) {
    return;
  }

  const canUseFullScreenIntent = await canUseNativeAlarmFullScreenIntent();
  if (canUseFullScreenIntent) {
    console.log('[AlarmScheduler] Permiso Android full-screen intent disponible.');
    return;
  }

  console.log(
    '[AlarmScheduler] Permiso Android full-screen intent desactivado. La alarma puede quedar solo como notificacion.',
  );
}

export async function openNativeAlarmFullScreenSettings(): Promise<void> {
  if (!NativeAlarmScheduler?.openFullScreenIntentSettings) return;
  await NativeAlarmScheduler.openFullScreenIntentSettings();
}

async function ensureNativeAlarmFullScreenPermissionAsync(): Promise<void> {
  if (!isNativeAndroidAlarmAvailable()) return;

  const canUseFullScreenIntent = await canUseNativeAlarmFullScreenIntent();
  if (canUseFullScreenIntent || fullScreenSettingsOpenedThisSession) return;

  fullScreenSettingsOpenedThisSession = true;
  console.log(
    '[AlarmScheduler] Abriendo ajustes de alarmas en pantalla completa. Activa este permiso para que la alarma aparezca sobre bloqueo.',
  );
  await openNativeAlarmFullScreenSettings();
}

export async function closeNativeAlarmScreen(): Promise<boolean> {
  if (Platform.OS !== 'android' || !NativeAlarmScheduler?.closeAlarmScreen) {
    return false;
  }

  try {
    return await NativeAlarmScheduler.closeAlarmScreen();
  } catch (error) {
    console.log('[AlarmScheduler] Native close alarm screen skipped:', error);
    return false;
  }
}

export async function getPendingNativeRingingAlarmId(): Promise<string | null> {
  if (Platform.OS !== 'android' || !NativeAlarmScheduler?.getPendingAlarmId) {
    return null;
  }

  try {
    const alarmId = await NativeAlarmScheduler.getPendingAlarmId();
    if (!alarmId) return null;

    return String(alarmId);
  } catch (error) {
    console.log('[AlarmScheduler] Pending native alarm check skipped:', error);
    return null;
  }
}

export function extractAlarmIdFromUrl(url: string): string | null {
  const match = url.match(/^[a-z][a-z0-9+.-]*:\/\/alarm\/ringing\/([^?#]+)/i);
  if (!match?.[1]) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export async function shouldOpenRingingAlarmId(alarmId: string): Promise<boolean> {
  if (isNativeAndroidAlarmAvailable()) {
    const pendingAlarmId = await getPendingNativeRingingAlarmId();
    return pendingAlarmId === alarmId;
  }

  return !(await isRingingAlarmRecentlyResolved(alarmId));
}

function getAppScheme(): string {
  const expoConfig = Constants.expoConfig as { scheme?: string | string[] } | null;
  const scheme = expoConfig?.scheme;
  if (Array.isArray(scheme)) return scheme[0] ?? 'neurowake';
  return scheme ?? 'neurowake';
}

function buildAlarmContent(
  Notifications: typeof ExpoNotifications,
  alarm: Alarm,
  useCustomSound: boolean,
): ExpoNotifications.NotificationContentInput {
  return {
    title: alarm.label || 'Alarma',
    body: 'Toca para resolver la mision y apagar',
    sound: getNotificationSound(alarm.soundUri, useCustomSound),
    priority: Notifications.AndroidNotificationPriority.MAX,
    vibrate: ALARM_VIBRATION_PATTERN,
    data: alarmData(alarm.id),
    autoDismiss: false,
    sticky: true,
    interruptionLevel: 'timeSensitive',
  };
}

async function ensureAlarmChannelAsync(
  Notifications: typeof ExpoNotifications,
  soundUri: string | null,
  useCustomSound: boolean,
): Promise<string> {
  const channelId = useCustomSound ? getAlarmChannelId(soundUri) : ALARM_CHANNEL_ID;
  const soundResourceName = useCustomSound ? getSoundResourceName(soundUri) : undefined;

  if (Platform.OS !== 'android') return channelId;

  await Notifications.setNotificationChannelAsync(channelId, {
    name: soundUri ? 'Alarmas con sonido' : 'Alarmas silenciosas',
    description: 'Alarmas programadas de Neuro Wake',
    importance: Notifications.AndroidImportance.MAX,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    vibrationPattern: ALARM_VIBRATION_PATTERN,
    enableVibrate: true,
    showBadge: false,
    ...(soundUri && soundResourceName ? { sound: soundResourceName } : {}),
    ...(!soundUri ? { sound: null } : {}),
    audioAttributes: getAlarmAudioAttributes(Notifications),
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

function nextWeeklyDate(day: RepeatDay, hour: number, minute: number): Date {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  const daysUntilTarget = (day - now.getDay() + 7) % 7;
  target.setDate(now.getDate() + daysUntilTarget);

  if (target <= now) {
    target.setDate(target.getDate() + 7);
  }

  return target;
}

async function scheduleNativeAlarmTrigger(
  alarm: Alarm,
  scheduleId: string,
  triggerDate: Date,
  repeatIntervalMillis: number,
): Promise<void> {
  if (!NativeAlarmScheduler?.scheduleAlarm) return;

  await NativeAlarmScheduler.scheduleAlarm({
    alarmId: alarm.id,
    scheduleId,
    triggerAtMillis: triggerDate.getTime(),
    repeatIntervalMillis,
    label: alarm.label || 'Alarma',
    soundUri: normalizeSoundUri(alarm.soundUri),
    scheme: getAppScheme(),
  });
}

async function scheduleNativeAlarm(alarm: Alarm): Promise<void> {
  if (alarm.repeatDays.length === 0) {
    const triggerDate = nextDate(alarm.hour, alarm.minute);
    await scheduleNativeAlarmTrigger(alarm, `alarm-${alarm.id}-once`, triggerDate, 0);
    console.log(
      `[AlarmScheduler] Alarma nativa ${alarm.id} programada para ${triggerDate.toISOString()}`,
    );
    return;
  }

  for (const day of alarm.repeatDays) {
    const triggerDate = nextWeeklyDate(day, alarm.hour, alarm.minute);
    await scheduleNativeAlarmTrigger(
      alarm,
      `alarm-${alarm.id}-day-${day}`,
      triggerDate,
      WEEK_INTERVAL_MS,
    );
    console.log(
      `[AlarmScheduler] Alarma nativa ${alarm.id} repetida dia ${day} programada para ${triggerDate.toISOString()}`,
    );
  }
}

async function cancelNativeAlarmByAlarmId(alarmId: string): Promise<void> {
  if (!NativeAlarmScheduler?.cancelAlarm) return;

  try {
    await NativeAlarmScheduler.cancelAlarm(alarmId);
  } catch (error) {
    console.log('[AlarmScheduler] Native cancel skipped:', error);
  }
}

async function stopNativeRingingAlarm(alarmId: string): Promise<void> {
  if (!NativeAlarmScheduler?.stopAlarm) return;

  try {
    await NativeAlarmScheduler.stopAlarm(alarmId);
  } catch (error) {
    console.log('[AlarmScheduler] Native stop skipped:', error);
  }
}

async function scheduleOneTimeAlarm(alarm: Alarm): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const useCustomSound = isNativeAndroidAlarmAvailable();
  const channelId = await ensureAlarmChannelAsync(Notifications, alarm.soundUri, useCustomSound);
  const triggerDate = nextDate(alarm.hour, alarm.minute);
  const identifier = await Notifications.scheduleNotificationAsync({
    identifier: `alarm-${alarm.id}-once`,
    content: buildAlarmContent(Notifications, alarm, useCustomSound),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
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

  const useCustomSound = isNativeAndroidAlarmAvailable();
  const channelId = await ensureAlarmChannelAsync(Notifications, alarm.soundUri, useCustomSound);

  for (const day of repeatDays) {
    const identifier = await Notifications.scheduleNotificationAsync({
      identifier: `alarm-${alarm.id}-day-${day}`,
      content: buildAlarmContent(Notifications, alarm, useCustomSound),
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
    logNativeAlarmAvailabilityOnce();
    await logNativeFullScreenPermissionAsync();

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
      const useCustomSound = isNativeAndroidAlarmAvailable();
      await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
        name: 'Alarmas',
        description: 'Canal principal para alarmas programadas',
        importance: Notifications.AndroidImportance.MAX,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        vibrationPattern: ALARM_VIBRATION_PATTERN,
        enableVibrate: true,
        showBadge: false,
        ...(useCustomSound ? { sound: DEFAULT_ALARM_SOUND_URI } : {}),
        audioAttributes: getAlarmAudioAttributes(Notifications),
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
    await cancelNativeAlarmByAlarmId(alarmId);

    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const alarmNotifications = scheduled.filter(
      item => String(item.content.data?.alarmId ?? '') === alarmId,
    );

    for (const item of alarmNotifications) {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }

    const presented = await Notifications.getPresentedNotificationsAsync();
    const presentedAlarmNotifications = presented.filter(
      item => String(item.request.content.data?.alarmId ?? '') === alarmId,
    );

    for (const item of presentedAlarmNotifications) {
      await Notifications.dismissNotificationAsync(item.request.identifier);
    }
  } catch (error) {
    console.log('[AlarmScheduler] Cancel skipped:', error);
  }
}

export async function dismissRingingAlarmByAlarmId(alarmId: string): Promise<void> {
  try {
    await markRingingAlarmResolved(alarmId);
    await stopNativeRingingAlarm(alarmId);

    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    const presented = await Notifications.getPresentedNotificationsAsync();
    const presentedAlarmNotifications = presented.filter(
      item => String(item.request.content.data?.alarmId ?? '') === alarmId,
    );

    for (const item of presentedAlarmNotifications) {
      await Notifications.dismissNotificationAsync(item.request.identifier);
    }
  } catch (error) {
    console.log('[AlarmScheduler] Dismiss skipped:', error);
  }
}

export async function scheduleAlarmNotifications(alarm: Alarm): Promise<void> {
  try {
    await setupAlarmNotificationsAsync();
    await cancelAlarmNotificationsByAlarmId(alarm.id);

    if (!alarm.enabled) return;

    if (isNativeAndroidAlarmAvailable()) {
      try {
        await ensureNativeAlarmFullScreenPermissionAsync();
        await scheduleNativeAlarm(alarm);
        return;
      } catch (error) {
        console.log('[AlarmScheduler] Native schedule failed, using Expo fallback:', error);
      }
    }

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
