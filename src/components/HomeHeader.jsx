import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { STAGES } from '../constants/zenStages';

export default function HomeHeader({ 
  time, 
  activeDate, 
  todayStr, 
  onTimelinePress, 
  onFocusPress,
  maxStreak,
  onZenPress,
}) {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  // Determine current zen stage emoji
  let stage = STAGES[0];
  for (let i = 0; i < STAGES.length; i++) {
    if (maxStreak <= STAGES[i].max) {
      stage = STAGES[i];
      break;
    }
  }

  return (
    <>
      <View style={styles.headerTopRow}>
        <TouchableOpacity 
          style={styles.liveClock} 
          activeOpacity={0.7} 
          onPress={onTimelinePress}
        >
          <Text style={styles.clockTime}>
            {time.toLocaleTimeString(language === 'en' ? 'en-US' : 'tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={styles.clockDate}>
            {time.toLocaleDateString(language === 'en' ? 'en-US' : 'tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </TouchableOpacity>

        <View style={styles.headerRightContainer}>
          {/* Compact Zen Garden button */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.zenHeaderButton}
            onPress={onZenPress}
          >
            <Text style={styles.zenEmoji}>{stage.emoji}</Text>
            <Text style={styles.zenStreakText}>{maxStreak}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.7} 
            style={styles.focusHeaderButton} 
            onPress={onFocusPress}
          >
            <Feather name="target" size={16} color={theme.accent} />
            <Text style={styles.focusHeaderButtonText}>Focus</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>
          {activeDate === todayStr ? t('home.today') : new Date(activeDate).toLocaleDateString(language === 'en' ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'short' })}
        </Text>
        <Text style={styles.pageSubtitle}>
          {activeDate === todayStr ? t('home.what_to_do') : t('nav.stats')}
        </Text>
      </View>
    </>
  );
}

const getStyles = (theme) => StyleSheet.create({
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing?.lg || 20,
    marginTop: theme.spacing?.sm || 8,
  },
  liveClock: {
    flex: 1,
  },
  clockTime: {
    fontFamily: theme.fonts?.bold,
    fontSize: 34,
    color: theme.textMain,
    letterSpacing: -1,
  },
  clockDate: {
    fontFamily: theme.fonts?.medium,
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 4,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  focusHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.accent + '20',
    paddingHorizontal: theme.spacing?.md || 16,
    paddingVertical: 10,
    borderRadius: theme.radii?.full || 20,
  },
  focusHeaderButtonText: {
    fontFamily: theme.fonts?.bold,
    color: theme.accent,
    fontSize: 14,
  },
  zenHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.card,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: theme.radii?.full || 20,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  zenEmoji: {
    fontSize: 18,
  },
  zenStreakText: {
    fontFamily: theme.fonts?.bold,
    fontSize: 13,
    color: theme.textMain,
  },
  pageHeader: {
    marginBottom: theme.spacing?.lg || 20,
  },
  pageTitle: {
    fontFamily: theme.fonts?.bold,
    fontSize: 42,
    color: theme.textMain,
    letterSpacing: -1.5,
  },
  pageSubtitle: {
    fontFamily: theme.fonts?.medium,
    fontSize: 18,
    color: theme.textMuted,
    marginTop: 4,
  }
});

