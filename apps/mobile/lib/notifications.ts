import { Platform } from 'react-native';
import { canUseExpoNotifications, canUseLocalNotifications, canUseRemotePushNotifications } from './device-capabilities';
import { savePushToken } from './api/preferences';
import type { ExamScheduleEvent } from './api/exam-calendar';
import { formatEventType } from './api/exam-calendar';

export { canUseExpoNotifications, canUseLocalNotifications, canUseRemotePushNotifications } from './device-capabilities';

const DAILY_REMINDER_ID = 'daily-reminder';
const EXAM_REMINDER_PREFIX = 'exam-reminder-';
const STREAK_AT_RISK_ID = 'streak-at-risk';
const STREAK_AT_RISK_HOUR = 20;

/** Deep imports avoid expo-notifications barrel side effects (Keychain auto-registration). */
async function loadNotificationsCore() {
  if (!canUseExpoNotifications()) return null;

  const [handler, permissions, scheduler, types] = await Promise.all([
    import('expo-notifications/build/NotificationsHandler'),
    import('expo-notifications/build/NotificationPermissions'),
    import('expo-notifications/build/scheduleNotificationAsync'),
    import('expo-notifications/build/Notifications.types'),
  ]);

  const cancelMod = await import('expo-notifications/build/cancelScheduledNotificationAsync');
  const listMod = await import('expo-notifications/build/getAllScheduledNotificationsAsync');

  return {
    setNotificationHandler: handler.setNotificationHandler,
    getPermissionsAsync: permissions.getPermissionsAsync,
    requestPermissionsAsync: permissions.requestPermissionsAsync,
    scheduleNotificationAsync: scheduler.scheduleNotificationAsync,
    cancelScheduledNotificationAsync: cancelMod.cancelScheduledNotificationAsync,
    getAllScheduledNotificationsAsync: listMod.getAllScheduledNotificationsAsync,
    SchedulableTriggerInputTypes: types.SchedulableTriggerInputTypes,
  };
}

let handlerConfigured = false;

async function ensureHandler() {
  if (handlerConfigured || Platform.OS === 'web' || !canUseExpoNotifications()) return;
  const Notifications = await loadNotificationsCore();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  handlerConfigured = true;
}

export async function registerForPushNotifications(userId?: string): Promise<string | null> {
  if (!canUseRemotePushNotifications()) return null;

  try {
    await ensureHandler();
    const Notifications = await loadNotificationsCore();
    if (!Notifications) return null;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      const channels = await import('expo-notifications/build/setNotificationChannelAsync');
      const types = await import('expo-notifications/build/NotificationChannelManager.types');
      await channels.setNotificationChannelAsync('daily-reminder', {
        name: 'Daily reminders',
        importance: types.AndroidImportance.DEFAULT,
      });
    }

    const { getExpoPushTokenAsync } = await import('expo-notifications/build/getExpoPushTokenAsync');
    const { setAutoServerRegistrationEnabledAsync } = await import(
      'expo-notifications/build/DevicePushTokenAutoRegistration.fx'
    );
    await setAutoServerRegistrationEnabledAsync(false);

    const tokenData = await getExpoPushTokenAsync();
    const token = tokenData.data;

    if (userId && token) {
      await savePushToken(userId, token, Platform.OS);
    }

    return token;
  } catch {
    return null;
  }
}

export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  context?: { streakDays?: number; dueFlashcards?: number }
): Promise<void> {
  if (!canUseLocalNotifications()) return;

  const body =
    context?.streakDays && context.streakDays >= 3
      ? `🔥 ${context.streakDays}-day streak! Time to keep it going.`
      : context?.dueFlashcards && context.dueFlashcards > 0
        ? `${context.dueFlashcards} flashcards due — quick review time!`
        : "Time for your PasaPath session — you've got this!";

  try {
    await ensureHandler();
    const Notifications = await loadNotificationsCore();
    if (!Notifications) return;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: next } = await Notifications.requestPermissionsAsync();
      if (next !== 'granted') return;
    }

    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_ID,
      content: {
        title: 'ReviewNatin 📚',
        body,
        sound: true,
        data: { url: 'reviewnatin://home', screen: 'home' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch {
    /* unsigned simulator builds */
  }
}

/**
 * Evening "streak at risk" nudge. Scheduled as a one-shot for the next 8 PM when
 * the user has an active streak but hasn't practiced today. Re-evaluated on each
 * app open (callers cancel it once the user practices), which keeps it
 * conditional without a server. Local-only until FCM remote push ships.
 */
export async function scheduleStreakAtRiskReminder(streakDays: number): Promise<void> {
  if (!canUseLocalNotifications()) return;
  if (streakDays < 1) return;

  try {
    await ensureHandler();
    const Notifications = await loadNotificationsCore();
    if (!Notifications) return;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const now = new Date();
    const trigger = new Date(now);
    trigger.setHours(STREAK_AT_RISK_HOUR, 0, 0, 0);
    if (trigger.getTime() <= now.getTime()) {
      trigger.setDate(trigger.getDate() + 1);
    }

    await Notifications.cancelScheduledNotificationAsync(STREAK_AT_RISK_ID).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: STREAK_AT_RISK_ID,
      content: {
        title: 'ReviewNatin 🔥',
        body: `${streakDays}-day streak mo — mag-quick review bago mag-hatinggabi para hindi maputol!`,
        sound: true,
        data: { url: 'reviewnatin://home', screen: 'home' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
  } catch {
    /* unsigned simulator builds */
  }
}

export async function cancelStreakAtRiskReminder(): Promise<void> {
  if (!canUseLocalNotifications()) return;
  try {
    const Notifications = await loadNotificationsCore();
    if (!Notifications) return;
    await Notifications.cancelScheduledNotificationAsync(STREAK_AT_RISK_ID).catch(() => {});
  } catch {
    /* ignore */
  }
}

export async function cancelReminders(): Promise<void> {
  if (!canUseLocalNotifications()) return;

  try {
    const Notifications = await loadNotificationsCore();
    if (!Notifications) return;

    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
    await Notifications.cancelScheduledNotificationAsync(STREAK_AT_RISK_ID).catch(() => {});
    await cancelExamReminders();
  } catch {
    /* ignore */
  }
}

export async function cancelExamReminders(): Promise<void> {
  if (!canUseLocalNotifications()) return;

  try {
    const Notifications = await loadNotificationsCore();
    if (!Notifications) return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.identifier.startsWith(EXAM_REMINDER_PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {}))
    );
  } catch {
    /* ignore */
  }
}

export async function scheduleExamReminders(events: ExamScheduleEvent[]): Promise<void> {
  if (!canUseLocalNotifications()) return;

  try {
    await ensureHandler();
    const Notifications = await loadNotificationsCore();
    if (!Notifications) return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.identifier.startsWith(EXAM_REMINDER_PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {}))
    );

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const reminderDays = [14, 7, 1];

    for (const event of events) {
      if (event.daysUntil < 0) continue;

      for (const daysBefore of reminderDays) {
        if (event.daysUntil !== daysBefore) continue;

        const eventDate = new Date(event.eventDate + 'T09:00:00');
        const triggerDate = new Date(eventDate);
        triggerDate.setDate(triggerDate.getDate() - daysBefore);
        triggerDate.setHours(9, 0, 0, 0);

        if (triggerDate.getTime() <= Date.now()) continue;

        const id = `${EXAM_REMINDER_PREFIX}${event.id}-${daysBefore}d`;
        await Notifications.scheduleNotificationAsync({
          identifier: id,
          content: {
            title: 'Exam calendar 📅',
            body: `${formatEventType(event.eventType)} in ${daysBefore} day${daysBefore === 1 ? '' : 's'} — verify on official sites.`,
            sound: true,
            data: { url: 'reviewnatin://exam-calendar', screen: 'exam_calendar' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });
      }
    }
  } catch {
    /* unsigned simulator builds */
  }
}
