import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { STAGES } from '../../constants/zenStages';
import AnimatedModalWrapper from './AnimatedModalWrapper';

export default function ZenJourneyModal({ isOpen, onClose, maxStreak = 0, xp = 0, levelInfo }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (isOpen && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: false });
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const reversedStages = [...STAGES].reverse();

  return (
    <AnimatedModalWrapper visible={isOpen} onClose={onClose} align="flex-end">
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Zen Yolu</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={theme.textMain} />
          </TouchableOpacity>
        </View>
          
        <View style={styles.bannerContainer}>
          <View style={styles.progressBanner}>
            <Feather name="trending-up" size={18} color={theme.accent} style={{ marginRight: 8 }} />
            <Text style={styles.bannerText}>
              {t('zen.current_streak')}<Text style={styles.bannerHighlight}>{maxStreak} {t('zen.days')}</Text>
            </Text>
          </View>

        </View>

        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {reversedStages.map((stage, index) => {
            const originalIndex = STAGES.length - 1 - index;
            const prevStageMax = originalIndex > 0 ? STAGES[originalIndex - 1].max : 0;
            const isUnlocked = maxStreak > prevStageMax;
            const isCurrent = maxStreak > prevStageMax && maxStreak <= stage.max;
            const isLast = index === reversedStages.length - 1;

            const totalNeeded = stage.max - prevStageMax;
            const currentProgress = maxStreak - prevStageMax;
            let fillPercentage = 0;
            
            if (maxStreak > stage.max) {
              fillPercentage = 100;
            } else if (isCurrent) {
              fillPercentage = Math.min(100, Math.max(0, (currentProgress / totalNeeded) * 100));
            }

            return (
              <View key={stage.titleKey} style={styles.nodeContainer}>
                
                {/* Left Side: The Line and Node */}
                <View style={styles.pathColumn}>
                  {!isLast && (
                    <View style={styles.lineTrack}>
                      <View style={[styles.lineFill, { height: `${fillPercentage}%`, backgroundColor: theme.accent }]} />
                    </View>
                  )}
                  
                  {/* The Node */}
                  <View style={[
                    styles.node, 
                    isUnlocked ? { backgroundColor: theme.card, borderColor: theme.accent, borderWidth: 3 } : { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 2 },
                    isCurrent && { ...styles.nodeCurrent, shadowColor: theme.accent }
                  ]}>
                    {isUnlocked ? (
                      <Text style={styles.nodeEmoji}>{stage.emoji}</Text>
                    ) : (
                      <Feather name="lock" size={28} color={theme.textMuted} />
                    )}
                  </View>
                </View>

                {/* Right Side: The Content Card */}
                <View style={[
                  styles.contentCard,
                  isUnlocked ? { opacity: 1, borderLeftWidth: 4, borderLeftColor: theme.accent } : { opacity: 0.5, borderLeftWidth: 1, borderLeftColor: theme.border }
                ]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.stageTitle}>{t(stage.titleKey)}</Text>
                    <View style={[
                      styles.requirementBadge,
                      isUnlocked ? { backgroundColor: theme.accent + '20' } : { backgroundColor: theme.border }
                    ]}>
                      <Text style={[
                        styles.requirementText,
                        isUnlocked ? { color: theme.accent } : { color: theme.textMuted }
                      ]}>
                        {stage.max === Infinity ? t('zen.infinite') : `${stage.max} ${t('zen.days')}`}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.stageMessage}>{t(stage.messageKey)}</Text>
                </View>
                
              </View>
            );
          })}


        </ScrollView>
      </View>
    </AnimatedModalWrapper>
  );
}

const getStyles = (theme) => StyleSheet.create({
  modalContent: {
    backgroundColor: theme.background,
    paddingTop: 40,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    marginHorizontal: 12,
    marginBottom: 12,
    maxHeight: '92%',
    borderWidth: 0.5,
    borderColor: theme.border,
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
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.textMain,
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContainer: {
    alignItems: 'center',
    marginBottom: 10,
    zIndex: 10,
  },
  progressBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: theme.border,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  bannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textMuted,
  },
  bannerHighlight: {
    color: theme.textMain,
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  nodeContainer: {
    flexDirection: 'row',
    minHeight: 140, // Height determines line length
  },
  pathColumn: {
    width: 90,
    alignItems: 'center',
    position: 'relative',
  },
  node: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2, // Node is above the line
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  nodeCurrent: {
    transform: [{ scale: 1.15 }],
    borderWidth: 4,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  nodeEmoji: {
    fontSize: 36,
  },
  lineTrack: {
    position: 'absolute',
    top: 70, // Starts from bottom of the node
    bottom: -70, // Reaches to the center of the next node
    width: 12,
    backgroundColor: theme.card, // faint track
    zIndex: 1,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end', // Fill grows from bottom to top
  },
  lineFill: {
    width: '100%',
    borderRadius: 6,
  },
  contentCard: {
    flex: 1,
    backgroundColor: theme.card,
    padding: 20,
    borderRadius: 24,
    borderTopLeftRadius: 12, // Sharp corner pointing to node
    borderBottomLeftRadius: 12,
    justifyContent: 'center',
    marginBottom: 40, // Space below each card
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.textMain,
    flex: 1,
    marginRight: 10,
  },
  stageMessage: {
    fontSize: 14,
    color: theme.textMuted,
    lineHeight: 20,
  },
  requirementBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  requirementText: {
    fontSize: 12,
    fontWeight: '800',
  },
  // XP Banner
  xpBanner: {
    width: '100%',
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: theme.border,
    marginTop: 10,
  },
  xpBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  xpBannerLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: theme.textMain,
  },
  xpBadge: {
    backgroundColor: theme.accent,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  xpBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  xpBarTrack: {
    width: '100%',
    height: 8,
    backgroundColor: theme.background,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: theme.accent,
    borderRadius: 6,
  },
  xpBannerSub: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '600',
    textAlign: 'right',
  },
  // XP Bilgi Kartı
  xpInfoCard: {
    backgroundColor: theme.accent + '15',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.accent + '40',
  },
  xpInfoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.accent,
    marginBottom: 10,
  },
  xpInfoItem: {
    fontSize: 13,
    color: theme.textMuted,
    lineHeight: 22,
    fontWeight: '600',
  },
});
