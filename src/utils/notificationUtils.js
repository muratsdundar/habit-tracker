import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set default notification handler so foreground notifications appear
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests local notification permissions.
 * @returns {Promise<boolean>} Granted status
 */
export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Cancels all scheduled notifications for a given list of notification IDs.
 * @param {string[]} notificationIds 
 */
export async function cancelNotifications(notificationIds) {
  if (!notificationIds || !Array.isArray(notificationIds)) return;
  for (const id of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      console.warn(`Failed to cancel notification with ID: ${id}`, e);
    }
  }
}

/**
 * Schedules local notifications for a habit or task.
 * @param {object} item The task/habit item
 * @returns {Promise<string[]>} Scheduled notification IDs
 */
export async function scheduleItemNotifications(item) {
  if (Platform.OS === 'web') return [];
  
  // 1. Ensure notifications are enabled and we have times set
  if (!item.notificationsEnabled || !item.notificationTimes || item.notificationTimes.length === 0) {
    return [];
  }

  // 2. Request permission first
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.warn('Notification permission not granted');
    return [];
  }

  const scheduledIds = [];
  const itemEmoji = item.emoji || '🔔';
  const itemTitle = `${itemEmoji} ${item.name}`;
  const itemBody = item.type === 'habit' 
    ? 'Alışkanlığını tamamlama zamanı geldi! Streak\'ini koru. 🔥'
    : 'Görevin için zaman geldi! Tamamlamak için dokun. 🎯';

  for (const timeStr of item.notificationTimes) {
    const [hourStr, minuteStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (isNaN(hour) || isNaN(minute)) continue;

    try {
      if (item.freqType === 'daily' || !item.freqType) {
        // Daily Notification
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: itemTitle,
            body: itemBody,
            data: { itemId: item.id, type: item.type },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
          },
        });
        scheduledIds.push(id);
      } 
      else if (item.freqType === 'weekly') {
        // Weekly Notification for each selected day
        const days = item.freqValues || [1]; // 1 = Monday
        for (const appDay of days) {
          // Convert our Monday-start (1-7) to Expo's Sunday-start (1-7, 1=Sunday)
          const expoWeekday = (appDay % 7) + 1;

          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: itemTitle,
              body: itemBody,
              data: { itemId: item.id, type: item.type },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: expoWeekday,
              hour,
              minute,
            },
          });
          scheduledIds.push(id);
        }
      } 
      else if (item.freqType === 'monthly') {
        // Monthly Notification for each selected date
        const dates = item.freqValues || [1];
        for (const day of dates) {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: itemTitle,
              body: itemBody,
              data: { itemId: item.id, type: item.type },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
              day,
              hour,
              minute,
            },
          });
          scheduledIds.push(id);
        }
      } 
      else if (item.freqType === 'yearly') {
        // Yearly Notification (freqValues contain months 1-12)
        const months = item.freqValues || [1];
        // For yearly, we might need a day as well. Let's use 1st of the month if not specified.
        for (const appMonth of months) {
          const jsMonth = appMonth - 1; // JS date range (0-11)
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: itemTitle,
              body: itemBody,
              data: { itemId: item.id, type: item.type },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.YEARLY,
              month: jsMonth,
              day: 1, // First of the month
              hour,
              minute,
            },
          });
          scheduledIds.push(id);
        }
      } 
      else if (item.freqType === 'instant') {
        // One-time notification for today
        const targetDate = new Date();
        targetDate.setHours(hour, minute, 0, 0);

        // If time has already passed today, don't schedule
        if (targetDate.getTime() > Date.now()) {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: itemTitle,
              body: itemBody,
              data: { itemId: item.id, type: item.type },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: targetDate,
            },
          });
          scheduledIds.push(id);
        }
      }
    } catch (error) {
      console.error(`Failed to schedule notification for time ${timeStr} and freq ${item.freqType}:`, error);
    }
  }

  return scheduledIds;
}
