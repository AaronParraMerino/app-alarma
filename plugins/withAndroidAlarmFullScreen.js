const fs = require('fs');
const path = require('path');
const {
  withAndroidManifest,
  withDangerousMod,
  withGradleProperties,
  withMainActivity,
  withMainApplication,
} = require('expo/config-plugins');

function ensureArray(parent, key) {
  if (!parent[key]) parent[key] = [];
  return parent[key];
}

function upsertManifestItem(items, item) {
  const name = item.$['android:name'];
  const index = items.findIndex(existing => existing.$?.['android:name'] === name);
  if (index >= 0) {
    items[index] = {
      ...items[index],
      $: {
        ...items[index].$,
        ...item.$,
      },
    };
    return;
  }

  items.push(item);
}

function removeManifestItem(items, androidName) {
  const index = items.findIndex(existing => existing.$?.['android:name'] === androidName);
  if (index >= 0) {
    items.splice(index, 1);
  }
}

function upsertUsesPermission(manifest, permissionName) {
  upsertManifestItem(ensureArray(manifest, 'uses-permission'), {
    $: {
      'android:name': permissionName,
    },
  });
}

function addNativePackage(contents, packageName) {
  const importLine = `import ${packageName}.alarm.NeuroWakeAlarmPackage`;
  let nextContents = contents;

  if (!nextContents.includes(importLine)) {
    nextContents = nextContents.replace(
      /^package .+$/m,
      match => `${match}\n\n${importLine}`,
    );
  }

  if (!nextContents.includes('NeuroWakeAlarmPackage()')) {
    if (nextContents.includes('PackageList(this).packages.apply')) {
      nextContents = nextContents.replace(
        /(PackageList\(this\)\.packages\.apply\s*\{\s*)/,
        `$1          add(NeuroWakeAlarmPackage())\n`,
      );
    } else {
      nextContents = nextContents.replace(
        /(val packages = PackageList\(this\)\.packages\s*)/,
        `$1      packages.add(NeuroWakeAlarmPackage())\n`,
      );
    }
  }

  return nextContents;
}

function addMainActivityAlarmWindow(contents) {
  let nextContents = contents;

  if (!nextContents.includes('import android.content.Intent')) {
    nextContents = nextContents.replace(
      'import android.os.Bundle',
      'import android.os.Bundle\nimport android.content.Intent\nimport android.view.WindowManager',
    );
  }

  if (!nextContents.includes('configureAlarmWindow(intent)')) {
    nextContents = nextContents.replace(
      /(\s+SplashScreenManager\.registerOnActivity\(this\)\s*\n\s+\/\/ @generated end expo-splashscreen\s*\n)(\s+super\.onCreate\(null\))/,
      `$1    configureAlarmWindow(intent)\n$2`,
    );
  }

  if (!nextContents.includes('private fun configureAlarmWindow')) {
    nextContents = nextContents.replace(
      /\n\s+\/\*\*\n\s+\* Returns the name of the main component registered from JavaScript\./,
      `
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    configureAlarmWindow(intent)
  }

  private fun configureAlarmWindow(intent: Intent?) {
    val uri = intent?.data
    if (uri?.host != "alarm" || uri.path?.startsWith("/ringing") != true) {
      clearAlarmWindow()
      return
    }

    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    window.addFlags(WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED)
      window.addFlags(WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
    }
  }

  private fun clearAlarmWindow() {
    window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    window.clearFlags(WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON)
    window.clearFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED)
    window.clearFlags(WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
    window.clearFlags(WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(false)
      setTurnScreenOn(false)
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript.`,
    );
  }

  return nextContents;
}

function javaSources(packageName) {
  const pkg = `${packageName}.alarm`;
  const appPackage = packageName;

  return {
    'AlarmConstants.java': `package ${pkg};

final class AlarmConstants {
  static final String MODULE_NAME = "NeuroWakeAlarmScheduler";
  static final String PREFS_NAME = "neuro_wake_alarm_scheduler";
  static final String CHANNEL_ID = "neuro_wake_native_alarm_v4";
  static final String ACTION_TRIGGER = "${appPackage}.alarm.ACTION_TRIGGER";
  static final String ACTION_STOP = "${appPackage}.alarm.ACTION_STOP";
  static final String EXTRA_ALARM_ID = "alarmId";
  static final String EXTRA_SCHEDULE_ID = "scheduleId";
  static final String EXTRA_LABEL = "label";
  static final String EXTRA_SOUND_URI = "soundUri";
  static final String EXTRA_MIN_VOLUME_PERCENT = "minVolumePercent";
  static final String EXTRA_VIBRATION_ENABLED = "vibrationEnabled";
  static final String EXTRA_VIBRATION_PATTERN = "vibrationPattern";
  static final String EXTRA_SCHEME = "scheme";
  static final String EXTRA_TRIGGER_AT = "triggerAtMillis";
  static final String EXTRA_REPEAT_INTERVAL = "repeatIntervalMillis";
  static final String KEY_ACTIVE_ALARM_ID = "activeAlarmId";

  private AlarmConstants() {}
}
`,
    'AlarmScheduler.java': `package ${pkg};

import android.app.AlarmManager;
import android.app.KeyguardManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;

import java.util.HashSet;
import java.util.Set;

final class AlarmScheduler {
  private static final long MIN_SCHEDULE_DELAY_MS = 1000L;

  private AlarmScheduler() {}

  static void schedule(
    Context context,
    String alarmId,
    String scheduleId,
    long triggerAtMillis,
    long repeatIntervalMillis,
    String label,
    String soundUri,
    int minVolumePercent,
    boolean vibrationEnabled,
    String vibrationPattern,
    String scheme
  ) {
    long safeTriggerAtMillis = Math.max(triggerAtMillis, System.currentTimeMillis() + MIN_SCHEDULE_DELAY_MS);
    AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    PendingIntent operation = createBroadcastPendingIntent(
      context,
      alarmId,
      scheduleId,
      safeTriggerAtMillis,
      repeatIntervalMillis,
      label,
      soundUri,
      minVolumePercent,
      vibrationEnabled,
      vibrationPattern,
      scheme
    );

    if (alarmManager == null) {
      return;
    }

    PendingIntent showIntent = PendingIntent.getActivity(
      context,
      requestCode(scheduleId + ":show"),
      createFullScreenIntent(context, alarmId, label, soundUri, scheme),
      pendingIntentFlags(PendingIntent.FLAG_UPDATE_CURRENT)
    );

    AlarmManager.AlarmClockInfo alarmClockInfo = new AlarmManager.AlarmClockInfo(
      safeTriggerAtMillis,
      showIntent
    );
    alarmManager.setAlarmClock(alarmClockInfo, operation);
    saveSchedule(context, alarmId, scheduleId);
  }

  static void cancelAlarm(Context context, String alarmId) {
    SharedPreferences prefs = prefs(context);
    Set<String> scheduleIds = new HashSet<>(
      prefs.getStringSet(scheduleKey(alarmId), new HashSet<String>())
    );

    AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    if (alarmManager != null) {
      for (String scheduleId : scheduleIds) {
        PendingIntent pendingIntent = createBroadcastPendingIntent(context, scheduleId);
        if (pendingIntent != null) {
          alarmManager.cancel(pendingIntent);
        }
      }
    }

    prefs.edit().remove(scheduleKey(alarmId)).apply();
  }

  static void rescheduleNext(Context context, Intent sourceIntent) {
    long repeatIntervalMillis = sourceIntent.getLongExtra(AlarmConstants.EXTRA_REPEAT_INTERVAL, 0L);
    if (repeatIntervalMillis <= 0L) {
      return;
    }

    String alarmId = sourceIntent.getStringExtra(AlarmConstants.EXTRA_ALARM_ID);
    String scheduleId = sourceIntent.getStringExtra(AlarmConstants.EXTRA_SCHEDULE_ID);
    if (alarmId == null || scheduleId == null) {
      return;
    }

    long nextTrigger = sourceIntent.getLongExtra(
      AlarmConstants.EXTRA_TRIGGER_AT,
      System.currentTimeMillis()
    ) + repeatIntervalMillis;

    while (nextTrigger <= System.currentTimeMillis()) {
      nextTrigger += repeatIntervalMillis;
    }

    schedule(
      context,
      alarmId,
      scheduleId,
      nextTrigger,
      repeatIntervalMillis,
      sourceIntent.getStringExtra(AlarmConstants.EXTRA_LABEL),
      sourceIntent.getStringExtra(AlarmConstants.EXTRA_SOUND_URI),
      sourceIntent.getIntExtra(AlarmConstants.EXTRA_MIN_VOLUME_PERCENT, 100),
      sourceIntent.getBooleanExtra(AlarmConstants.EXTRA_VIBRATION_ENABLED, true),
      sourceIntent.getStringExtra(AlarmConstants.EXTRA_VIBRATION_PATTERN),
      sourceIntent.getStringExtra(AlarmConstants.EXTRA_SCHEME)
    );
  }

  static Intent createFullScreenIntent(
    Context context,
    String alarmId,
    String label,
    String soundUri,
    String scheme
  ) {
    return createReactIntent(context, alarmId, scheme);
  }

  static Intent createReactIntent(Context context, String alarmId, String scheme) {
    String safeScheme = scheme == null || scheme.trim().isEmpty() ? "neurowake" : scheme;
    String safeAlarmId = alarmId == null ? "" : alarmId;
    Uri alarmUri = Uri.parse(safeScheme + "://alarm/ringing/" + Uri.encode(safeAlarmId));
    Intent intent = new Intent(Intent.ACTION_VIEW, alarmUri);
    intent.setClass(context, AlarmActivity.class);
    intent.putExtra(AlarmConstants.EXTRA_ALARM_ID, alarmId);
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
    intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
    intent.addFlags(Intent.FLAG_ACTIVITY_NO_USER_ACTION);
    return intent;
  }

  static int notificationId(String alarmId) {
    return Math.abs(("alarm:" + alarmId).hashCode());
  }

  static boolean shouldOpenAlarmScreen(Context context) {
    try {
      KeyguardManager keyguardManager = (KeyguardManager) context.getSystemService(Context.KEYGUARD_SERVICE);
      if (keyguardManager != null && keyguardManager.isKeyguardLocked()) {
        return true;
      }

      PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
      if (powerManager == null) {
        return true;
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH) {
        return !powerManager.isInteractive();
      }

      return !powerManager.isScreenOn();
    } catch (Exception ignored) {
      return true;
    }
  }

  private static PendingIntent createBroadcastPendingIntent(Context context, String scheduleId) {
    Intent intent = new Intent(context, AlarmReceiver.class);
    intent.setAction(AlarmConstants.ACTION_TRIGGER);
    return PendingIntent.getBroadcast(
      context,
      requestCode(scheduleId),
      intent,
      pendingIntentFlags(PendingIntent.FLAG_NO_CREATE)
    );
  }

  private static PendingIntent createBroadcastPendingIntent(
    Context context,
    String alarmId,
    String scheduleId,
    long triggerAtMillis,
    long repeatIntervalMillis,
    String label,
    String soundUri,
    int minVolumePercent,
    boolean vibrationEnabled,
    String vibrationPattern,
    String scheme
  ) {
    Intent intent = new Intent(context, AlarmReceiver.class);
    intent.setAction(AlarmConstants.ACTION_TRIGGER);
    intent.putExtra(AlarmConstants.EXTRA_ALARM_ID, alarmId);
    intent.putExtra(AlarmConstants.EXTRA_SCHEDULE_ID, scheduleId);
    intent.putExtra(AlarmConstants.EXTRA_TRIGGER_AT, triggerAtMillis);
    intent.putExtra(AlarmConstants.EXTRA_REPEAT_INTERVAL, repeatIntervalMillis);
    intent.putExtra(AlarmConstants.EXTRA_LABEL, label);
    intent.putExtra(AlarmConstants.EXTRA_SOUND_URI, soundUri);
    intent.putExtra(AlarmConstants.EXTRA_MIN_VOLUME_PERCENT, minVolumePercent);
    intent.putExtra(AlarmConstants.EXTRA_VIBRATION_ENABLED, vibrationEnabled);
    intent.putExtra(AlarmConstants.EXTRA_VIBRATION_PATTERN, vibrationPattern);
    intent.putExtra(AlarmConstants.EXTRA_SCHEME, scheme);

    return PendingIntent.getBroadcast(
      context,
      requestCode(scheduleId),
      intent,
      pendingIntentFlags(PendingIntent.FLAG_UPDATE_CURRENT)
    );
  }

  private static int pendingIntentFlags(int baseFlags) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      return baseFlags | PendingIntent.FLAG_IMMUTABLE;
    }

    return baseFlags;
  }

  private static int requestCode(String value) {
    return value == null ? 0 : value.hashCode();
  }

  private static void saveSchedule(Context context, String alarmId, String scheduleId) {
    SharedPreferences prefs = prefs(context);
    Set<String> current = new HashSet<>(
      prefs.getStringSet(scheduleKey(alarmId), new HashSet<String>())
    );
    current.add(scheduleId);
    prefs.edit().putStringSet(scheduleKey(alarmId), current).apply();
  }

  private static SharedPreferences prefs(Context context) {
    return context.getSharedPreferences(AlarmConstants.PREFS_NAME, Context.MODE_PRIVATE);
  }

  private static String scheduleKey(String alarmId) {
    return "schedules:" + alarmId;
  }
}
`,
    'AlarmActivity.kt': `package ${pkg}

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper
import expo.modules.splashscreen.SplashScreenManager

import ${appPackage}.BuildConfig

class AlarmActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    SplashScreenManager.registerOnActivity(this)
    configureAlarmWindow()
    super.onCreate(null)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    configureAlarmWindow()
  }

  private fun configureAlarmWindow() {
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    window.addFlags(WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED)
      window.addFlags(WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
      window.addFlags(WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD)
    }
  }

  override fun getMainComponentName(): String = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
      this,
      BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
      object : DefaultReactActivityDelegate(
        this,
        mainComponentName,
        fabricEnabled
      ) {}
    )
  }

  override fun invokeDefaultOnBackPressed() {
    moveTaskToBack(true)
  }
}
`,
    'AlarmReceiver.java': `package ${pkg};

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.content.ContextCompat;

public class AlarmReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    if (intent == null) {
      return;
    }

    AlarmScheduler.rescheduleNext(context, intent);

    Intent serviceIntent = new Intent(context, AlarmRingingService.class);
    serviceIntent.setAction(AlarmConstants.ACTION_TRIGGER);
    serviceIntent.putExtras(intent);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      ContextCompat.startForegroundService(context, serviceIntent);
    } else {
      context.startService(serviceIntent);
    }

    if (AlarmScheduler.shouldOpenAlarmScreen(context)) {
      try {
        context.startActivity(
          AlarmScheduler.createFullScreenIntent(
            context,
            intent.getStringExtra(AlarmConstants.EXTRA_ALARM_ID),
            intent.getStringExtra(AlarmConstants.EXTRA_LABEL),
            intent.getStringExtra(AlarmConstants.EXTRA_SOUND_URI),
            intent.getStringExtra(AlarmConstants.EXTRA_SCHEME)
          )
        );
      } catch (Exception ignored) {
        // Android may block background activity starts. The foreground notification
        // also carries a full-screen intent and is the primary wake-up path.
      }
    }
  }
}
`,
    'AlarmRingingService.java': `package ${pkg};

import android.app.KeyguardManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.util.Locale;

public class AlarmRingingService extends Service {
  private static final long VOLUME_GUARD_INTERVAL_MS = 500L;

  private MediaPlayer mediaPlayer;
  private PowerManager.WakeLock wakeLock;
  private AudioManager audioManager;
  private AudioFocusRequest audioFocusRequest;
  private Handler volumeGuardHandler;
  private Runnable volumeGuardRunnable;
  private Vibrator vibrator;
  private int previousAlarmVolume = -1;
  private int minAlarmVolumePercent = 100;
  private boolean shouldRestoreAlarmVolume = false;
  private String currentAlarmId;
  private final AudioManager.OnAudioFocusChangeListener audioFocusChangeListener =
    new AudioManager.OnAudioFocusChangeListener() {
      @Override
      public void onAudioFocusChange(int focusChange) {
      }
    };

  static void stop(Context context, String alarmId) {
    Intent intent = new Intent(context, AlarmRingingService.class);
    intent.setAction(AlarmConstants.ACTION_STOP);
    intent.putExtra(AlarmConstants.EXTRA_ALARM_ID, alarmId);
    context.startService(intent);

    NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    if (manager != null && alarmId != null) {
      manager.cancel(AlarmScheduler.notificationId(alarmId));
    }
  }

  @Override
  public void onCreate() {
    super.onCreate();
    ensureChannel();
  }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    if (intent != null && AlarmConstants.ACTION_STOP.equals(intent.getAction())) {
      String alarmId = intent.getStringExtra(AlarmConstants.EXTRA_ALARM_ID);
      stopSound();
      releaseWakeLock();
      clearActiveAlarmId(alarmId);
      stopForegroundCompat();
      stopSelf();
      return START_NOT_STICKY;
    }

    if (intent == null) {
      return START_NOT_STICKY;
    }

    String alarmId = intent.getStringExtra(AlarmConstants.EXTRA_ALARM_ID);
    String label = intent.getStringExtra(AlarmConstants.EXTRA_LABEL);
    String soundUri = intent.getStringExtra(AlarmConstants.EXTRA_SOUND_URI);
    minAlarmVolumePercent = normalizeMinVolumePercent(
      intent.getIntExtra(AlarmConstants.EXTRA_MIN_VOLUME_PERCENT, 100)
    );
    boolean vibrationEnabled = intent.getBooleanExtra(AlarmConstants.EXTRA_VIBRATION_ENABLED, true);
    String vibrationPattern = intent.getStringExtra(AlarmConstants.EXTRA_VIBRATION_PATTERN);
    String scheme = intent.getStringExtra(AlarmConstants.EXTRA_SCHEME);

    currentAlarmId = alarmId;
    saveActiveAlarmId(alarmId);
    boolean shouldOpenAlarmScreen = shouldOpenAlarmScreen();
    wakeScreen();
    Notification notification = buildNotification(alarmId, label, soundUri, vibrationEnabled, vibrationPattern, scheme);
    int notificationId = AlarmScheduler.notificationId(alarmId == null ? "active" : alarmId);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(notificationId, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
    } else {
      startForeground(notificationId, notification);
    }

    startSound(soundUri);
    startVibration(vibrationEnabled, vibrationPattern);
    if (shouldOpenAlarmScreen) {
      openAlarmScreen(alarmId, label, soundUri, scheme);
    }
    return START_STICKY;
  }

  @Nullable
  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }

  @Override
  public void onDestroy() {
    stopSound();
    releaseWakeLock();
    super.onDestroy();
  }

  private Notification buildNotification(
    String alarmId,
    String label,
    String soundUri,
    boolean vibrationEnabled,
    String vibrationPattern,
    String scheme
  ) {
    Intent fullScreenIntent = AlarmScheduler.createFullScreenIntent(this, alarmId, label, soundUri, scheme);
    PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
      this,
      AlarmScheduler.notificationId(alarmId == null ? "active" : alarmId),
      fullScreenIntent,
      pendingIntentFlags(PendingIntent.FLAG_UPDATE_CURRENT)
    );

    String title = label == null || label.trim().isEmpty() ? "Alarma" : label;

    return new NotificationCompat.Builder(this, AlarmConstants.CHANNEL_ID)
      .setSmallIcon(getApplicationInfo().icon)
      .setContentTitle(title)
      .setContentText("Toca para resolver la alarma")
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setAutoCancel(false)
      .setVibrate(vibrationEnabled ? resolveVibrationPattern(vibrationPattern) : null)
      .setSound(null)
      .setContentIntent(fullScreenPendingIntent)
      .setFullScreenIntent(fullScreenPendingIntent, true)
      .build();
  }

  private boolean shouldOpenAlarmScreen() {
    return AlarmScheduler.shouldOpenAlarmScreen(this);
  }

  private void openAlarmScreen(String alarmId, String label, String soundUri, String scheme) {
    try {
      startActivity(
        AlarmScheduler.createFullScreenIntent(
          this,
          alarmId,
          label,
          soundUri,
          scheme
        )
      );
    } catch (Exception ignored) {
    }
  }

  private void wakeScreen() {
    try {
      PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
      if (powerManager == null) {
        return;
      }

      if (wakeLock != null && wakeLock.isHeld()) {
        return;
      }

      wakeLock = powerManager.newWakeLock(
        PowerManager.SCREEN_BRIGHT_WAKE_LOCK
          | PowerManager.ACQUIRE_CAUSES_WAKEUP
          | PowerManager.ON_AFTER_RELEASE,
        getPackageName() + ":AlarmWakeLock"
      );
      wakeLock.setReferenceCounted(false);
      wakeLock.acquire(10 * 60 * 1000L);
    } catch (Exception ignored) {
    }
  }

  private void releaseWakeLock() {
    if (wakeLock == null) {
      return;
    }

    try {
      if (wakeLock.isHeld()) {
        wakeLock.release();
      }
    } catch (Exception ignored) {
    }

    wakeLock = null;
  }

  private void saveActiveAlarmId(String alarmId) {
    if (alarmId == null || alarmId.trim().isEmpty()) {
      return;
    }

    getSharedPreferences(AlarmConstants.PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .putString(AlarmConstants.KEY_ACTIVE_ALARM_ID, alarmId)
      .apply();
  }

  private void clearActiveAlarmId(String alarmId) {
    String activeAlarmId = getSharedPreferences(AlarmConstants.PREFS_NAME, Context.MODE_PRIVATE)
      .getString(AlarmConstants.KEY_ACTIVE_ALARM_ID, null);

    if (alarmId != null && activeAlarmId != null && !alarmId.equals(activeAlarmId)) {
      return;
    }

    getSharedPreferences(AlarmConstants.PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .remove(AlarmConstants.KEY_ACTIVE_ALARM_ID)
      .apply();
  }

  private void startSound(String soundUri) {
    stopSound();

    if (soundUri == null || soundUri.trim().isEmpty()) {
      return;
    }

    try {
      requestAlarmAudioFocus();
      startVolumeGuard();

      int rawResourceId = resolveRawSound(soundUri);
      if (rawResourceId != 0) {
        mediaPlayer = MediaPlayer.create(this, rawResourceId, alarmAudioAttributes(), 0);
      } else {
        Uri fallback = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (fallback == null) {
          fallback = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        }
        mediaPlayer = new MediaPlayer();
        mediaPlayer.setDataSource(this, fallback);
        mediaPlayer.setAudioAttributes(alarmAudioAttributes());
        mediaPlayer.prepare();
      }

      if (mediaPlayer == null) {
        abandonAlarmAudioFocus();
        return;
      }

      try {
        mediaPlayer.setWakeMode(getApplicationContext(), PowerManager.PARTIAL_WAKE_LOCK);
      } catch (Exception ignored) {
      }

      mediaPlayer.setLooping(true);
      mediaPlayer.setVolume(1f, 1f);
      mediaPlayer.start();
    } catch (Exception ignored) {
      stopSound();
    }
  }

  private void stopSound() {
    stopVibration();
    stopVolumeGuard();

    if (mediaPlayer == null) {
      abandonAlarmAudioFocus();
      return;
    }

    try {
      if (mediaPlayer.isPlaying()) {
        mediaPlayer.stop();
      }
    } catch (Exception ignored) {
    }

    try {
      mediaPlayer.release();
    } catch (Exception ignored) {
    }

    mediaPlayer = null;
    abandonAlarmAudioFocus();
  }

  private void startVolumeGuard() {
    try {
      if (audioManager == null) {
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
      }

      if (audioManager == null) {
        return;
      }

      if (!shouldRestoreAlarmVolume) {
        previousAlarmVolume = audioManager.getStreamVolume(AudioManager.STREAM_ALARM);
        shouldRestoreAlarmVolume = true;
      }

      setInitialAlarmVolume();

      if (volumeGuardHandler == null) {
        volumeGuardHandler = new Handler(Looper.getMainLooper());
      }

      if (volumeGuardRunnable != null) {
        volumeGuardHandler.removeCallbacks(volumeGuardRunnable);
      }

      volumeGuardRunnable = new Runnable() {
        @Override
        public void run() {
          if (mediaPlayer == null) {
            return;
          }

          enforceMinimumAlarmVolume();

          if (volumeGuardHandler != null) {
            volumeGuardHandler.postDelayed(this, VOLUME_GUARD_INTERVAL_MS);
          }
        }
      };

      volumeGuardHandler.postDelayed(volumeGuardRunnable, VOLUME_GUARD_INTERVAL_MS);
    } catch (Exception ignored) {
    }
  }

  private void stopVolumeGuard() {
    try {
      if (volumeGuardHandler != null && volumeGuardRunnable != null) {
        volumeGuardHandler.removeCallbacks(volumeGuardRunnable);
      }

      if (
        audioManager != null
          && shouldRestoreAlarmVolume
          && previousAlarmVolume >= 0
      ) {
        int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM);
        int restoredVolume = Math.max(0, Math.min(previousAlarmVolume, maxVolume));
        audioManager.setStreamVolume(AudioManager.STREAM_ALARM, restoredVolume, 0);
      }
    } catch (Exception ignored) {
    }

    volumeGuardRunnable = null;
    previousAlarmVolume = -1;
    shouldRestoreAlarmVolume = false;
  }

  private int normalizeMinVolumePercent(int value) {
    return Math.max(0, Math.min(100, value));
  }

  private int getMinimumAlarmVolume() {
    if (audioManager == null) {
      return 0;
    }

    int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM);
    if (maxVolume <= 0) {
      return 0;
    }

    return (int) Math.ceil(maxVolume * (minAlarmVolumePercent / 100.0));
  }

  private void setInitialAlarmVolume() {
    try {
      if (audioManager == null) {
        return;
      }

      int initialVolume = getMinimumAlarmVolume();
      if (initialVolume > 0) {
        audioManager.setStreamVolume(AudioManager.STREAM_ALARM, initialVolume, 0);
      }
    } catch (Exception ignored) {
    }
  }

  private void enforceMinimumAlarmVolume() {
    try {
      if (audioManager == null) {
        return;
      }

      int minimumVolume = getMinimumAlarmVolume();
      if (minimumVolume <= 0) {
        return;
      }

      int currentVolume = audioManager.getStreamVolume(AudioManager.STREAM_ALARM);
      if (currentVolume < minimumVolume) {
        audioManager.setStreamVolume(AudioManager.STREAM_ALARM, minimumVolume, 0);
      }
    } catch (Exception ignored) {
    }
  }

  private void requestAlarmAudioFocus() {
    try {
      audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
      if (audioManager == null) {
        return;
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
          .setAudioAttributes(alarmAudioAttributes())
          .setOnAudioFocusChangeListener(audioFocusChangeListener)
          .build();
        audioManager.requestAudioFocus(audioFocusRequest);
        return;
      }

      audioManager.requestAudioFocus(
        audioFocusChangeListener,
        AudioManager.STREAM_ALARM,
        AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
      );
    } catch (Exception ignored) {
    }
  }

  private void startVibration(boolean vibrationEnabled, String vibrationPattern) {
    stopVibration();

    if (!vibrationEnabled) {
      return;
    }

    try {
      vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
      if (vibrator == null || !vibrator.hasVibrator()) {
        return;
      }

      long[] pattern = resolveVibrationPattern(vibrationPattern);

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        vibrator.vibrate(
          VibrationEffect.createWaveform(pattern, 0)
        );
      } else {
        vibrator.vibrate(pattern, 0);
      }
    } catch (Exception ignored) {
    }
  }

  private void stopVibration() {
    if (vibrator == null) {
      return;
    }

    try {
      vibrator.cancel();
    } catch (Exception ignored) {
    }

    vibrator = null;
  }

  private long[] resolveVibrationPattern(String vibrationPattern) {
    if (vibrationPattern == null) {
      return new long[] { 0, 500, 350, 500, 350, 900 };
    }

    String normalized = vibrationPattern.trim();

    if ("shortPulse".equals(normalized)) {
      return new long[] { 0, 180, 130, 180, 130, 180, 600 };
    }

    if ("intense".equals(normalized)) {
      return new long[] { 0, 800, 180, 800, 180, 1000 };
    }

    if ("steady".equals(normalized)) {
      return new long[] { 0, 1200, 250, 1200, 450 };
    }

    return new long[] { 0, 500, 350, 500, 350, 900 };
  }

  private void abandonAlarmAudioFocus() {
    try {
      if (audioManager == null) {
        return;
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
        audioManager.abandonAudioFocusRequest(audioFocusRequest);
      } else {
        audioManager.abandonAudioFocus(audioFocusChangeListener);
      }
    } catch (Exception ignored) {
    }

    audioFocusRequest = null;
  }

  private int resolveRawSound(String soundUri) {
    String name = soundUri;
    int slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\\\'));
    if (slash >= 0 && slash + 1 < name.length()) {
      name = name.substring(slash + 1);
    }

    int dot = name.lastIndexOf('.');
    if (dot > 0) {
      name = name.substring(0, dot);
    }

    name = name.toLowerCase(Locale.US).replaceAll("[^a-z0-9_]", "_");
    return getResources().getIdentifier(name, "raw", getPackageName());
  }

  private AudioAttributes alarmAudioAttributes() {
    return new AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_ALARM)
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .build();
  }

  private void ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return;
    }

    NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
    if (manager == null) {
      return;
    }

    NotificationChannel channel = new NotificationChannel(
      AlarmConstants.CHANNEL_ID,
      "Alarmas activas",
      NotificationManager.IMPORTANCE_HIGH
    );
    channel.setDescription("Alarma en ejecucion");
    channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
    channel.enableVibration(false);
    channel.setSound(null, null);
    manager.createNotificationChannel(channel);
  }

  private void stopForegroundCompat() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE);
    } else {
      stopForeground(true);
    }
  }

  private int pendingIntentFlags(int baseFlags) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      return baseFlags | PendingIntent.FLAG_IMMUTABLE;
    }
    return baseFlags;
  }
}
`,
    'NeuroWakeAlarmPackage.java': `package ${pkg};

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class NeuroWakeAlarmPackage implements ReactPackage {
  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();
    modules.add(new NeuroWakeAlarmSchedulerModule(reactContext));
    return modules;
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }
}
`,
    'NeuroWakeAlarmSchedulerModule.java': `package ${pkg};

import android.app.Activity;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.view.WindowManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

public class NeuroWakeAlarmSchedulerModule extends ReactContextBaseJavaModule {
  public NeuroWakeAlarmSchedulerModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return AlarmConstants.MODULE_NAME;
  }

  @ReactMethod
  public void isAvailable(Promise promise) {
    promise.resolve(true);
  }

  @ReactMethod
  public void canUseFullScreenIntent(Promise promise) {
    try {
      if (Build.VERSION.SDK_INT < 34) {
        promise.resolve(true);
        return;
      }

      Context context = getReactApplicationContext().getApplicationContext();
      NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
      promise.resolve(manager != null && manager.canUseFullScreenIntent());
    } catch (Exception error) {
      promise.reject("ERR_FULL_SCREEN_INTENT_STATUS", error);
    }
  }

  @ReactMethod
  public void openFullScreenIntentSettings(Promise promise) {
    try {
      Context context = getReactApplicationContext().getApplicationContext();
      Intent intent;
      if (Build.VERSION.SDK_INT >= 34) {
        intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
        intent.setData(Uri.parse("package:" + context.getPackageName()));
      } else {
        intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setData(Uri.parse("package:" + context.getPackageName()));
      }
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      context.startActivity(intent);
      promise.resolve(null);
    } catch (Exception error) {
      promise.reject("ERR_FULL_SCREEN_INTENT_SETTINGS", error);
    }
  }

  @ReactMethod
  public void scheduleAlarm(ReadableMap options, Promise promise) {
    try {
      String alarmId = options.getString("alarmId");
      String scheduleId = options.getString("scheduleId");
      long triggerAtMillis = (long) options.getDouble("triggerAtMillis");
      long repeatIntervalMillis = options.hasKey("repeatIntervalMillis")
        ? (long) options.getDouble("repeatIntervalMillis")
        : 0L;
      String label = options.hasKey("label") && !options.isNull("label")
        ? options.getString("label")
        : null;
      String soundUri = options.hasKey("soundUri") && !options.isNull("soundUri")
        ? options.getString("soundUri")
        : null;
      boolean vibrationEnabled = !options.hasKey("vibrationEnabled")
        || options.isNull("vibrationEnabled")
        || options.getBoolean("vibrationEnabled");
      String vibrationPattern = options.hasKey("vibrationPattern") && !options.isNull("vibrationPattern")
        ? options.getString("vibrationPattern")
        : "classic";
      int minVolumePercent = options.hasKey("minVolumePercent") && !options.isNull("minVolumePercent")
        ? Math.max(0, Math.min(100, (int) Math.round(options.getDouble("minVolumePercent"))))
        : 100;
      String scheme = options.hasKey("scheme") && !options.isNull("scheme")
        ? options.getString("scheme")
        : "neurowake";

      Context context = getReactApplicationContext().getApplicationContext();
      AlarmScheduler.schedule(
        context,
        alarmId,
        scheduleId,
        triggerAtMillis,
        repeatIntervalMillis,
        label,
        soundUri,
        minVolumePercent,
        vibrationEnabled,
        vibrationPattern,
        scheme
      );
      promise.resolve(null);
    } catch (Exception error) {
      promise.reject("ERR_ALARM_SCHEDULE", error);
    }
  }

  @ReactMethod
  public void cancelAlarm(String alarmId, Promise promise) {
    try {
      Context context = getReactApplicationContext().getApplicationContext();
      AlarmScheduler.cancelAlarm(context, alarmId);
      promise.resolve(null);
    } catch (Exception error) {
      promise.reject("ERR_ALARM_CANCEL", error);
    }
  }

  @ReactMethod
  public void stopAlarm(String alarmId, Promise promise) {
    try {
      Context context = getReactApplicationContext().getApplicationContext();
      clearActiveAlarmId(context, alarmId);
      AlarmRingingService.stop(context, alarmId);
      promise.resolve(null);
    } catch (Exception error) {
      promise.reject("ERR_ALARM_STOP", error);
    }
  }

  @ReactMethod
  public void getPendingAlarmId(Promise promise) {
    try {
      Context context = getReactApplicationContext().getApplicationContext();
      String activeAlarmId = context
        .getSharedPreferences(AlarmConstants.PREFS_NAME, Context.MODE_PRIVATE)
        .getString(AlarmConstants.KEY_ACTIVE_ALARM_ID, null);

      if (activeAlarmId == null || activeAlarmId.trim().isEmpty()) {
        promise.resolve(null);
        return;
      }

      Activity activity = getCurrentActivity();
      String intentAlarmId = activity == null ? null : extractAlarmIdFromIntent(activity.getIntent());
      if (
        intentAlarmId != null
        && !intentAlarmId.trim().isEmpty()
        && !activeAlarmId.equals(intentAlarmId)
      ) {
        promise.resolve(null);
        return;
      }

      promise.resolve(activeAlarmId);
    } catch (Exception error) {
      promise.reject("ERR_PENDING_ALARM_ID", error);
    }
  }

  @ReactMethod
  public void closeAlarmScreen(Promise promise) {
    try {
      Activity activity = getCurrentActivity();
      if (activity == null) {
        promise.resolve(false);
        return;
      }

      activity.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          try {
            activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON);
            activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED);
            activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
            activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
              activity.setShowWhenLocked(false);
              activity.setTurnScreenOn(false);
            }

            activity.setIntent(new Intent(activity, activity.getClass()));

            if (activity.getClass().getName().endsWith(".alarm.AlarmActivity")) {
              if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                activity.finishAndRemoveTask();
              } else {
                activity.finish();
              }
            } else {
              activity.moveTaskToBack(true);
            }

            promise.resolve(true);
          } catch (Exception error) {
            promise.reject("ERR_ALARM_SCREEN_CLOSE", error);
          }
        }
      });
    } catch (Exception error) {
      promise.reject("ERR_ALARM_SCREEN_CLOSE", error);
    }
  }

  private String extractAlarmIdFromIntent(Intent intent) {
    if (intent == null) {
      return null;
    }

    String alarmId = intent.getStringExtra(AlarmConstants.EXTRA_ALARM_ID);
    if (alarmId != null && !alarmId.trim().isEmpty()) {
      return alarmId;
    }

    Uri data = intent.getData();
    if (data == null || !"alarm".equals(data.getHost())) {
      return null;
    }

    String path = data.getPath();
    if (path == null || !path.startsWith("/ringing")) {
      return null;
    }

    return data.getLastPathSegment();
  }

  private void clearActiveAlarmId(Context context, String alarmId) {
    String activeAlarmId = context
      .getSharedPreferences(AlarmConstants.PREFS_NAME, Context.MODE_PRIVATE)
      .getString(AlarmConstants.KEY_ACTIVE_ALARM_ID, null);

    if (alarmId != null && activeAlarmId != null && !alarmId.equals(activeAlarmId)) {
      return;
    }

    context
      .getSharedPreferences(AlarmConstants.PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .remove(AlarmConstants.KEY_ACTIVE_ALARM_ID)
      .apply();
  }
}
`,
  };
}

function writeNativeFiles(projectRoot, packageName) {
  const packagePath = packageName.replace(/\./g, path.sep);
  const sourceDir = path.join(
    projectRoot,
    'android',
    'app',
    'src',
    'main',
    'java',
    packagePath,
    'alarm',
  );
  fs.mkdirSync(sourceDir, { recursive: true });

  for (const [filename, contents] of Object.entries(javaSources(packageName))) {
    fs.writeFileSync(path.join(sourceDir, filename), contents);
  }

  for (const obsoleteFile of ['FullScreenAlarmActivity.java']) {
    const obsoletePath = path.join(sourceDir, obsoleteFile);
    if (fs.existsSync(obsoletePath)) {
      fs.unlinkSync(obsoletePath);
    }
  }

  const valuesDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'values');
  const obsoleteStylePath = path.join(valuesDir, 'neuro_wake_alarm_styles.xml');
  if (fs.existsSync(obsoleteStylePath)) {
    fs.unlinkSync(obsoleteStylePath);
  }

  const sourceSoundsDir = path.join(projectRoot, 'assets', 'sounds');
  const rawSoundsDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'raw');
  if (fs.existsSync(sourceSoundsDir)) {
    fs.mkdirSync(rawSoundsDir, { recursive: true });
    for (const filename of fs.readdirSync(sourceSoundsDir)) {
      if (!/\.(mp3|wav|ogg)$/i.test(filename)) continue;
      const sourceSoundPath = path.join(sourceSoundsDir, filename);
      if (fs.statSync(sourceSoundPath).size <= 0) continue;

      const ext = path.extname(filename).toLowerCase();
      const rawName = path
        .basename(filename, ext)
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_');

      fs.copyFileSync(
        sourceSoundPath,
        path.join(rawSoundsDir, `${rawName}${ext}`),
      );
    }
  }
}

function patchGradleWrapper(projectRoot) {
  const wrapperPath = path.join(
    projectRoot,
    'android',
    'gradle',
    'wrapper',
    'gradle-wrapper.properties',
  );

  if (!fs.existsSync(wrapperPath)) {
    return;
  }

  const contents = fs.readFileSync(wrapperPath, 'utf8');
  fs.writeFileSync(
    wrapperPath,
    contents.replace(
      /distributionUrl=.*gradle-[^-]+-bin\.zip/,
      'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.14.3-bin.zip',
    ),
  );
}

function setGradleProperty(gradleProperties, key, value) {
  const existing = gradleProperties.find(
    item => item.type === 'property' && item.key === key,
  );

  if (existing) {
    existing.value = value;
    return gradleProperties;
  }

  gradleProperties.push({ type: 'property', key, value });
  return gradleProperties;
}

module.exports = function withAndroidAlarmFullScreen(config) {
  const packageName = config.android?.package;
  if (!packageName) {
    throw new Error('withAndroidAlarmFullScreen requires expo.android.package');
  }

  config = withAndroidManifest(config, config => {
    const manifest = config.modResults.manifest;
    upsertUsesPermission(manifest, 'android.permission.MODIFY_AUDIO_SETTINGS');

    const application = manifest.application?.[0];
    if (!application) return config;

    const activities = ensureArray(application, 'activity');
    removeManifestItem(activities, '.alarm.FullScreenAlarmActivity');

    const mainActivity = activities.find(activity => {
      const name = activity.$?.['android:name'];
      return name === '.MainActivity' || name?.endsWith('.MainActivity');
    });

    if (mainActivity?.$) {
      delete mainActivity.$['android:showWhenLocked'];
      delete mainActivity.$['android:turnScreenOn'];
    }

    upsertManifestItem(activities, {
      $: {
        'android:name': '.alarm.AlarmActivity',
        'android:configChanges': 'keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode|smallestScreenSize',
        'android:excludeFromRecents': 'true',
        'android:exported': 'false',
        'android:launchMode': 'singleTask',
        'android:screenOrientation': 'portrait',
        'android:showWhenLocked': 'true',
        'android:taskAffinity': `${packageName}.alarm`,
        'android:theme': '@style/Theme.App.SplashScreen',
        'android:turnScreenOn': 'true',
        'android:windowSoftInputMode': 'adjustResize',
      },
    });

    upsertManifestItem(ensureArray(application, 'receiver'), {
      $: {
        'android:name': '.alarm.AlarmReceiver',
        'android:enabled': 'true',
        'android:exported': 'false',
      },
    });

    upsertManifestItem(ensureArray(application, 'service'), {
      $: {
        'android:name': '.alarm.AlarmRingingService',
        'android:enabled': 'true',
        'android:exported': 'false',
        'android:foregroundServiceType': 'mediaPlayback',
      },
    });

    return config;
  });

  config = withMainApplication(config, config => {
    config.modResults.contents = addNativePackage(config.modResults.contents, packageName);
    return config;
  });

  config = withMainActivity(config, config => {
    config.modResults.contents = addMainActivityAlarmWindow(config.modResults.contents);
    return config;
  });

  config = withGradleProperties(config, config => {
    config.modResults = setGradleProperty(config.modResults, 'newArchEnabled', 'false');
    return config;
  });

  config = withDangerousMod(config, [
    'android',
    config => {
      writeNativeFiles(config.modRequest.projectRoot, packageName);
      patchGradleWrapper(config.modRequest.projectRoot);
      return config;
    },
  ]);

  return config;
};
