import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { calculateStreak, calculateMaxStreakForHabit, isItemAvailable, getLocalDateStr } from '../../utils/habitUtils';
import AnimatedModalWrapper from './AnimatedModalWrapper';

export default function FullStatsModal({ isOpen, onClose, allItems }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { t } = useLanguage();

  const getRate = (item) => {
    const compDates = item.completedDates || [];
    const completions = compDates.length;
    const todayStr = getLocalDateStr(new Date());

    let rawCreatedStr = item.createdAtDate;
    if (completions === 0) {
      rawCreatedStr = todayStr;
    } else if (!rawCreatedStr) {
      const sortedComp = [...compDates].sort();
      rawCreatedStr = sortedComp[0];
    }

    const createdAtDateObj = new Date(rawCreatedStr || todayStr);
    createdAtDateObj.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let expectedSinceCreation = 0;
    const checkDate = new Date(createdAtDateObj);
    while (checkDate <= today) {
      if (isItemAvailable(item, checkDate)) {
        expectedSinceCreation++;
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
    
    const completionsBeforeCreation = compDates.filter(dStr => {
      const d = new Date(dStr);
      d.setHours(0, 0, 0, 0);
      return d < createdAtDateObj;
    }).length;
    
    const totalExpectedForItem = Math.max(expectedSinceCreation + completionsBeforeCreation, completions, 1);
    
    return Math.round((completions / totalExpectedForItem) * 100);
  };

  // Sort items by best streak descending
  const sortedItems = [...allItems].sort((a, b) => {
    const bStreak = calculateMaxStreakForHabit(b.completedDates, b.initialStreak, b.createdAtDate);
    const aStreak = calculateMaxStreakForHabit(a.completedDates, a.initialStreak, a.createdAtDate);
    return bStreak - aStreak;
  });

  return (
    // ─── FIX: Replaced raw <Modal animationType="slide"> with AnimatedModalWrapper ──
    // The raw Modal was rendered inside HabitSumPage's <ScrollView>, which caused
    // iOS's native touch/scroll system to freeze after the modal dismissed.
    // AnimatedModalWrapper renders at the true root-level Modal layer with proper
    // cleanup, fixing the scroll lock and invisible overlay bugs simultaneously.
    <AnimatedModalWrapper
      visible={isOpen}
      onClose={onClose}
      align="flex-end"
      overlayColor="rgba(0,0,0,0.5)"
    >
      <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={2} adjustsFontSizeToFit>{t('stats.detailed_table')}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.textMain} />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.tableContainer}>
              <View style={styles.table}>
                {/* Header */}
                <View style={[styles.row, styles.headerRow]}>
                  <Text style={[styles.cell, styles.headerCell, styles.nameCol]}>{t('table.habit')}</Text>
                  <Text style={[styles.cell, styles.headerCell, styles.numberCol]}>{t('table.current_streak')}</Text>
                  <Text style={[styles.cell, styles.headerCell, styles.numberCol]}>{t('table.best_streak')}</Text>
                  <Text style={[styles.cell, styles.headerCell, styles.numberCol]}>{t('table.total')}</Text>
                  <Text style={[styles.cell, styles.headerCell, styles.numberCol]}>{t('table.rate')}</Text>
                </View>
                
                {/* Rows */}
                {sortedItems.map((item, index) => {
                  const currentStreak = calculateStreak(item.completedDates, item.initialStreak, item.createdAtDate);
                  const bestStreak = calculateMaxStreakForHabit(item.completedDates, item.initialStreak, item.createdAtDate);
                  const totalCompletions = (item.completedDates || []).length;
                  const rate = getRate(item);
                  
                  return (
                    <View key={item.id} style={[styles.row, index % 2 === 1 && styles.rowAlt]}>
                      <View style={[styles.cell, styles.nameCol, styles.nameCell]}>
                        <Text style={styles.emoji}>{item.emoji}</Text>
                        <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
                      </View>
                      <Text style={[styles.cell, styles.numberCol, styles.valueText, styles.highlightText]}>🔥 {currentStreak}</Text>
                      <Text style={[styles.cell, styles.numberCol, styles.valueText]}>🏆 {bestStreak}</Text>
                      <Text style={[styles.cell, styles.numberCol, styles.valueText]}>{totalCompletions}</Text>
                      <Text style={[styles.cell, styles.numberCol, styles.valueText]}>%{rate}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </AnimatedModalWrapper>
  );
}

const getStyles = (theme) => StyleSheet.create({
  modalContent: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    marginHorizontal: 12,
    marginBottom: 12,
    maxHeight: '85%',
    borderWidth: 0.5,
    borderTopColor: theme.border,
    borderLeftColor: theme.border,
    borderRightColor: theme.border,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
  },
  modalTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: '900',
    color: theme.textMain,
    letterSpacing: -0.5,
    marginRight: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  tableContainer: {
    backgroundColor: theme.card,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: theme.border,
    overflow: 'hidden',
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  table: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  rowAlt: {
    backgroundColor: theme.background, 
  },
  headerRow: {
    backgroundColor: theme.background,
    borderBottomWidth: 2,
  },
  cell: {
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  headerCell: {
    color: theme.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  nameCol: {
    flex: 2,
    alignItems: 'flex-start',
    paddingLeft: 12,
  },
  numberCol: {
    flex: 1,
    alignItems: 'center',
  },
  nameCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 16,
    marginRight: 6,
  },
  nameText: {
    color: theme.textMain,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  valueText: {
    color: theme.textMain,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  highlightText: {
    color: theme.accent, 
  }
});
