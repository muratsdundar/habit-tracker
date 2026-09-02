import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { STAGES } from '../constants/zenStages';

export default function ZenGarden({ maxStreak, onPress }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);

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
  const progressPercent = stage.next ? (progressInStage / totalInStage) : 1;

  // Wave 1 Animation
  const wave1Anim = useRef(new Animated.Value(0)).current;
  // Wave 2 Animation
  const wave2Anim = useRef(new Animated.Value(0)).current;
  // Y-axis Water Level Animation
  const waterLevelAnim = useRef(new Animated.Value(112)).current;

  useEffect(() => {
    wave1Anim.setValue(0);
    wave2Anim.setValue(0);

    const anim1 = Animated.loop(
      Animated.timing(wave1Anim, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const anim2 = Animated.loop(
      Animated.timing(wave2Anim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    anim1.start();
    anim2.start();

    return () => {
      anim1.stop();
      anim2.stop();
    };
  }, [wave1Anim, wave2Anim]);

  useEffect(() => {
    const targetY = 112 - (progressPercent * 112);
    Animated.spring(waterLevelAnim, {
      toValue: targetY,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [progressPercent]);

  const translateX1 = useMemo(() => wave1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -112]
  }), [wave1Anim]);

  const translateX2 = useMemo(() => wave2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -140]
  }), [wave2Anim]);

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.7} 
      onPress={onPress}
    >
      <View style={styles.row}>
        <View style={styles.pondContainer}>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: waterLevelAnim }] }]}>
            <Animated.View style={{ position: 'absolute', top: 0, left: 0, transform: [{ translateX: translateX1 }] }} pointerEvents="none">
              <Svg width="400" height="200" viewBox="0 0 400 200">
                <Path d="M 0 10 Q 28 -5, 56 10 T 112 10 T 168 10 T 224 10 T 280 10 T 336 10 T 392 10 V 200 H 0 Z" fill={theme.accent} opacity={0.3} />
              </Svg>
            </Animated.View>
            <Animated.View style={{ position: 'absolute', top: 5, left: 0, transform: [{ translateX: translateX2 }] }} pointerEvents="none">
              <Svg width="450" height="200" viewBox="0 0 450 200">
                <Path d="M 0 10 Q 35 -10, 70 10 T 140 10 T 210 10 T 280 10 T 350 10 T 420 10 V 200 H 0 Z" fill={theme.success || '#10b981'} opacity={0.4} />
              </Svg>
            </Animated.View>
          </Animated.View>
          <View style={styles.emojiWrapper}>
            <Text style={styles.emoji}>{stage.emoji}</Text>
          </View>
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{t('zen.title')}</Text>
          </View>
          <Text style={styles.stageTitle}>{t(stage.titleKey)}</Text>
          <Text style={styles.message}>{t(stage.messageKey)}</Text>
          {stage.next && (
             <Text style={styles.progressText}>{t('zen.days_left', { days: stage.next - maxStreak }).replace('{days}', stage.next - maxStreak)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.card,
    borderRadius: 32,
    padding: 20,
    borderWidth: 0.5,
    borderColor: theme.border,
    marginBottom: 24,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pondContainer: {
    width: 112,
    height: 112,
    borderRadius: 40,
    backgroundColor: theme.background,
    borderWidth: 0.5,
    borderColor: theme.border,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  emoji: {
    fontSize: 42,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 12,
    color: theme.accent,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  stageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textMain,
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    color: theme.textMuted,
    lineHeight: 18,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.accent,
    backgroundColor: theme.accent + '1A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  }
});
