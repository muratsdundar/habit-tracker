import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { calculateMaxStreakForHabit } from '../utils/habitUtils';

export default function StatsTable({ allItems, onExpand }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { t } = useLanguage();

  // Sort items by Best Streak
  const sortedItems = [...allItems].sort((a, b) => {
    const bStreak = calculateMaxStreakForHabit(b.completedDates, b.initialStreak, b.createdAtDate);
    const aStreak = calculateMaxStreakForHabit(a.completedDates, a.initialStreak, a.createdAtDate);
    return bStreak - aStreak;
  });

  const top3 = sortedItems.slice(0, 3);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Lider Tablosu</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onExpand} style={styles.expandButton}>
          <Text style={styles.expandText}>Tümü</Text>
          <Feather name="chevron-right" size={18} color={theme.accent} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.widgetCard}>
        {top3.length === 0 ? (
          <Text style={styles.emptyText}>{t('msg.not_enough_data')}</Text>
        ) : (
          top3.map((item, index) => {
            const bestStreak = calculateMaxStreakForHabit(item.completedDates, item.initialStreak, item.createdAtDate);
            return (
              <View key={item.id} style={[styles.row, index === top3.length - 1 && styles.lastRow]}>
                <View style={styles.medalWrapper}>
                  <Text style={styles.medalIcon}>{medals[index]}</Text>
                </View>
                <View style={styles.infoWrapper}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.emoji} {item.name}</Text>
                  <Text style={styles.itemSub}>{t('msg.record', { streak: bestStreak }).replace('{streak}', bestStreak)}</Text>
                </View>
                <View style={styles.streakBadge}>
                  <Text style={styles.streakBadgeText}>🏆 {bestStreak}</Text>
                </View>
              </View>
            );
          })
        )}
        {sortedItems.length > 3 && (
          <TouchableOpacity activeOpacity={0.7} onPress={onExpand} style={styles.moreIndicator}>
            <Feather name="more-horizontal" size={24} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textMain,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.accent + '1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.accent,
    marginRight: 6,
  },
  widgetCard: {
    backgroundColor: theme.card,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: theme.border,
    padding: 20,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyText: {
    color: theme.textMuted,
    textAlign: 'center',
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  lastRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  medalWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  medalIcon: {
    fontSize: 22,
  },
  infoWrapper: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textMain,
    marginBottom: 4,
  },
  itemSub: {
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: '500',
  },
  streakBadge: {
    backgroundColor: theme.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  streakBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.textMain,
  },
  moreIndicator: {
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    borderStyle: 'dashed',
  }
});
