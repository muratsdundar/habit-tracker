import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getLocalDateStr } from '../utils/habitUtils';

export default function DailyPlannerSection({ allItems, isItemDay, handleToggle, openAddModal }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const now = new Date();
  const todayStr = getLocalDateStr(now);

  // Filter items with a targetTime scheduled for today, sorted by time
  const timedItems = allItems
    .filter(item => item.targetTime && isItemDay(item, now))
    .sort((a, b) => a.targetTime.localeCompare(b.targetTime));

  if (timedItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>{t('timeline.title')}</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🗓️</Text>
          <Text style={styles.emptyText}>{t('home.no_scheduled')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{t('timeline.title')}</Text>
        <Text style={styles.itemCount}>{timedItems.length} {t('home.planner_tasks')}</Text>
      </View>

      {timedItems.map(item => {
        const [hours, minutes] = item.targetTime.split(':').map(Number);
        const isPast = (hours < now.getHours()) || (hours === now.getHours() && minutes < now.getMinutes());
        const isCompleted = (item.completedDates || []).includes(todayStr);
        const itemColor = item.color || theme.accent;

        return (
          <View key={item.id} style={[styles.itemRow, isCompleted && styles.itemRowCompleted]}>
            {/* Time column */}
            <View style={styles.timeCol}>
              <Text style={[styles.timeText, isCompleted || isPast ? styles.timeTextPast : styles.timeTextActive]}>
                {item.targetTime}
              </Text>
              {!!item.endTime && (
                <Text style={styles.endTimeText}>{item.endTime}</Text>
              )}
            </View>

            {/* Card */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.card, { borderLeftColor: itemColor }]}
              onPress={() => handleToggle(item.id, item.type)}
            >
              <Text style={styles.emoji}>{item.emoji || '📌'}</Text>
              <Text
                style={[styles.itemName, isCompleted && styles.itemNameDone]}
                numberOfLines={2}
              >
                {item.name}
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.editBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    openAddModal(item.type, item);
                  }}
                >
                  <Feather name="edit-2" size={15} color={theme.textMuted} />
                </TouchableOpacity>

                <View style={[
                  styles.checkbox,
                  isCompleted && { backgroundColor: itemColor, borderColor: itemColor }
                ]}>
                  {isCompleted && <Feather name="check" size={14} color={theme.card} />}
                </View>
              </View>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: theme.fonts?.bold,
    fontSize: 22,
    color: theme.textMain,
    letterSpacing: -0.5,
  },
  itemCount: {
    fontFamily: theme.fonts?.medium,
    fontSize: 13,
    color: theme.textMuted,
    backgroundColor: theme.card,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: theme.card,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: theme.border,
    marginBottom: 8,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: theme.fonts?.medium,
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  itemRowCompleted: {
    opacity: 0.5,
  },
  timeCol: {
    width: 48,
    alignItems: 'flex-end',
  },
  timeText: {
    fontFamily: theme.fonts?.bold,
    fontSize: 13,
    fontWeight: '800',
  },
  timeTextActive: {
    color: theme.accent,
  },
  timeTextPast: {
    color: theme.textTertiary,
  },
  endTimeText: {
    fontFamily: theme.fonts?.medium,
    fontSize: 10,
    color: theme.textTertiary,
    marginTop: 2,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderWidth: 0.5,
    borderColor: theme.border,
    borderRadius: 20,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emoji: {
    fontSize: 20,
  },
  itemName: {
    flex: 1,
    fontFamily: theme.fonts?.bold,
    fontSize: 14,
    color: theme.textMain,
    lineHeight: 19,
  },
  itemNameDone: {
    textDecorationLine: 'line-through',
    color: theme.textMuted,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  editBtn: {
    padding: 4,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
