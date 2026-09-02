import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { STAGES } from '../../constants/zenStages';
import AnimatedModalWrapper from './AnimatedModalWrapper';
import InfoPopupModal from './InfoPopupModal';

export default function ZenStatsModal({ isOpen, onClose, maxStreak, totalCompleted, bestHabitName, onOpenJourney }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);
  const [showInfo, setShowInfo] = useState(false);

  if (!isOpen) return null;

  let stage = STAGES[0];
  let prevStageMax = 0;
  for (let i = 0; i < STAGES.length; i++) {
    if (maxStreak <= STAGES[i].max) {
      stage = STAGES[i];
      if (i > 0) prevStageMax = STAGES[i-1].max;
      break;
    }
  }

  const progressInStage = Math.max(0, maxStreak - prevStageMax);
  const totalInStage = stage.next ? (stage.next - prevStageMax) : 1;
  const progressPercent = stage.next ? (progressInStage / totalInStage) * 100 : 100;

  const strokeWidth = 12;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <AnimatedModalWrapper visible={isOpen} onClose={onClose} align="flex-end">
      <View style={styles.modalContent}>
        {/* Drag handle */}
        <View style={styles.dragHandle} />

        <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={2} adjustsFontSizeToFit>Zen Bahçesi İstatistikleri</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setShowInfo(true)} style={styles.iconButton}>
                <Feather name="info" size={20} color={theme.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={24} color={theme.textMain} />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView 
            style={styles.scrollArea}
            contentContainerStyle={styles.modalBody}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Big Plant Display */}
            <View style={styles.bigSvgContainer}>
              <Svg width="200" height="200" viewBox="0 0 200 200">
                <Defs>
                  <LinearGradient id="zenGradModal" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={theme.accent} stopOpacity="1" />
                    <Stop offset="1" stopColor={theme.success || '#10b981'} stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <Circle 
                  cx="100" cy="100" r={radius} 
                  stroke={theme.border} 
                  strokeWidth={strokeWidth} 
                  fill="transparent" 
                />
                <Circle 
                  cx="100" cy="100" r={radius} 
                  stroke="url(#zenGradModal)" 
                  strokeWidth={strokeWidth} 
                  fill="transparent" 
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                />
              </Svg>
              <View style={styles.bigEmojiWrapper}>
                <Text style={styles.bigEmoji}>{stage.emoji}</Text>
              </View>
            </View>

            <Text style={styles.stageTitle}>{t(stage.titleKey)}</Text>
            {stage.next && (
              <Text style={styles.progressText}>Sonraki evreye %{Math.round(progressPercent)} ({t('zen.days_left', { days: stage.next - maxStreak }).replace('{days}', stage.next - maxStreak)})</Text>
            )}

            {/* Stats Cards */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Feather name="star" size={24} color={theme.accent} style={styles.statIcon} />
                <Text style={styles.statLabel}>En İyi Seri</Text>
                <Text style={styles.statValue}>{maxStreak} {t('zen.days')}</Text>
              </View>
              
              <View style={styles.statCard}>
                <Feather name="check-circle" size={24} color={theme.success || '#10b981'} style={styles.statIcon} />
                <Text style={styles.statLabel}>{t('zen.total_tasks')}</Text>
                <Text style={styles.statValue}>{totalCompleted}</Text>
              </View>
            </View>



            {/* Bitki Evresi Çubuğu */}
            <View style={styles.stageBarCard}>
              <Text style={styles.stageBarTitle}>🌿 Zen Büyüme Yolu</Text>
              <View style={styles.stageBarRow}>
                {[{emoji:'🌱',label:'Tohum',max:2},{emoji:'🌿',label:'Filiz',max:6},{emoji:'🪴',label:'Fidan',max:14},{emoji:'🌸',label:'Çiçek',max:29},{emoji:'🌳',label:'Ağaç',max:Infinity}].map((s, i) => {
                  const isReached = s.max === Infinity ? maxStreak >= 30 : maxStreak > (i === 0 ? 0 : [0,2,6,14,29][i]);
                  const isCurrent = maxStreak <= s.max && (i === 0 ? true : maxStreak > [0,2,6,14,29][i]);
                  return (
                    <View key={i} style={styles.stageBarItem}>
                      <Text style={[styles.stageBarEmoji, isCurrent && styles.stageBarEmojiActive, !isReached && { opacity: 0.3 }]}>{s.emoji}</Text>
                      <Text style={[styles.stageBarLabel, isCurrent && { color: theme.accent, fontWeight: '800' }, !isReached && { opacity: 0.4 }]}>{s.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {bestHabitName && (
              <View style={styles.bestHabitCard}>
                <Text style={styles.bestHabitLabel}>{t('zen.best_habit')}</Text>
                <Text style={styles.bestHabitName}>🏆 {bestHabitName}</Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.journeyButton} 
              onPress={() => {
                onClose();
                if (onOpenJourney) onOpenJourney();
              }}
              activeOpacity={0.8}
            >
              <Feather name="map" size={20} color="#fff" />
              <Text style={styles.journeyButtonText}>Zen Yolu</Text>
            </TouchableOpacity>



          </ScrollView>
        </View>

        <InfoPopupModal 
          visible={showInfo} 
          onClose={() => setShowInfo(false)} 
          title="Nasıl Çalışır?"
          description={t('zen.desc')}
          icon="sun"
        />
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
    maxHeight: '92%',
    paddingBottom: 0,
    borderWidth: 0.5,
    borderColor: theme.border,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
    marginHorizontal: 12,
    marginBottom: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  scrollArea: {
    flexShrink: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 24,
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  bigSvgContainer: {
    width: 200,
    height: 200,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bigEmojiWrapper: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.border,
  },
  bigEmoji: {
    fontSize: 72,
  },
  stageTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.textMain,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted,
    marginBottom: 32,
    backgroundColor: theme.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.card,
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: theme.border,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statIcon: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textMain,
  },
  bestHabitCard: {
    width: '100%',
    backgroundColor: theme.accent + '1A',
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: theme.accent + '4D',
  },
  bestHabitLabel: {
    fontSize: 12,
    color: theme.accent,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bestHabitName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textMain,
  },
  journeyButton: {
    width: '100%',
    backgroundColor: theme.accent,
    paddingVertical: 16,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  journeyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // XP & Level Card
  xpCard: {
    width: '100%',
    backgroundColor: theme.card,
    padding: 20,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: theme.border,
    marginBottom: 16,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  xpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelBadgeSmall: {
    backgroundColor: theme.accent,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  levelBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  levelTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.textMain,
    marginBottom: 12,
  },
  xpBarTrack: {
    width: '100%',
    height: 10,
    backgroundColor: theme.background,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: theme.accent,
    borderRadius: 8,
  },
  xpDetail: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '600',
  },
  // Bitki Evresi Çubuğu
  stageBarCard: {
    width: '100%',
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: theme.border,
    marginBottom: 16,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  stageBarTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
    textAlign: 'center',
  },
  stageBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stageBarItem: {
    alignItems: 'center',
    flex: 1,
  },
  stageBarEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  stageBarEmojiActive: {
    fontSize: 36,
  },
  stageBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.textMuted,
    textAlign: 'center',
  },
});
