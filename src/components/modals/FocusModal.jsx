import React, { useEffect, useRef, useState } from 'react';
import { 
  Animated, 
  Easing, 
  Modal, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput,
  TouchableOpacity, 
  View 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

// Safe import for expo-audio (may not be available in simulator without native rebuild)
let createAudioPlayer = null;
try {
  const ExpoAudio = require('expo-audio');
  createAudioPlayer = ExpoAudio.createAudioPlayer;
} catch (e) {
  console.log('expo-audio not available, sound features disabled');
}


const PHASES = {
  SETUP: 'SETUP',
  FOCUS: 'FOCUS',
  FOCUS_DONE: 'FOCUS_DONE',
  BREAK: 'BREAK',
  BREAK_DONE: 'BREAK_DONE'
};

const SOUNDS = {
  lofi: 'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3',
  rain: 'https://assets.mixkit.co/music/preview/mixkit-rain-in-the-forest-2447.mp3',
  forest: 'https://assets.mixkit.co/music/preview/mixkit-forest-birds-and-wind-2443.mp3',
  waves: 'https://assets.mixkit.co/music/preview/mixkit-sea-waves-crashing-2444.mp3',
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function FocusModal({ isOpen, onClose, habit, onComplete, uncompletedItems = [] }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);

  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [phase, setPhase] = useState(PHASES.SETUP);
  const [isRunning, setIsRunning] = useState(false);

  // Focus to Do: linked item from uncompleted list
  const isCustomFocus = habit?.id?.startsWith('focus-to-do');
  const [linkedItem, setLinkedItem] = useState(null);

  const [animatedProgress] = useState(() => new Animated.Value(1));

  const playerRef = useRef(null);
  const currentSoundIdRef = useRef('none');
  const [selectedSoundId, setSelectedSoundId] = useState('none');

  const breakMinutes = Math.max(3, Math.floor(selectedMinutes / 5));
  const currentTotalSeconds = (phase === PHASES.BREAK || phase === PHASES.BREAK_DONE)
    ? breakMinutes * 60
    : selectedMinutes * 60;

  // Display name: use linked item if custom focus, otherwise habit name
  const displayName = isCustomFocus ? (linkedItem?.name || 'Focus to Do') : (habit?.name || '');

  // Handle soundscapes playback
  const handleSoundControl = () => {
    if (!createAudioPlayer) return; // Skip if expo-audio not available
    try {
      if (selectedSoundId === 'none' || !isRunning || phase === PHASES.FOCUS_DONE || phase === PHASES.BREAK_DONE) {
        if (playerRef.current) {
          try { playerRef.current.pause(); } catch (e) {}
        }
        return;
      }

      const soundUri = SOUNDS[selectedSoundId];
      if (!soundUri) return;

      if (!playerRef.current) {
        playerRef.current = createAudioPlayer(soundUri);
        if (playerRef.current) {
          playerRef.current.loop = true;
          playerRef.current.play();
          currentSoundIdRef.current = selectedSoundId;
        }
      } else {
        if (currentSoundIdRef.current !== selectedSoundId) {
          try {
            playerRef.current.replace(soundUri);
            playerRef.current.loop = true;
            currentSoundIdRef.current = selectedSoundId;
          } catch (e) {
            playerRef.current = createAudioPlayer(soundUri);
            if (playerRef.current) playerRef.current.loop = true;
          }
        }
        if (playerRef.current) {
          playerRef.current.play();
        }
      }
    } catch (err) {
      console.log('Error managing audio player:', err);
    }
  };

  useEffect(() => {
    handleSoundControl();
  }, [selectedSoundId, isRunning, phase]);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.pause();
          if (typeof playerRef.current.release === 'function') playerRef.current.release();
        } catch (err) {}
        playerRef.current = null;
      }
    };
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedMinutes(25);
      setTimeLeft(25 * 60);
      setPhase(PHASES.SETUP);
      setIsRunning(false);
      animatedProgress.setValue(1);
      setSelectedSoundId('none');
      setLinkedItem(isCustomFocus ? null : habit);
    } else {
      if (playerRef.current) {
        try {
          playerRef.current.pause();
          if (typeof playerRef.current.release === 'function') playerRef.current.release();
        } catch (err) {}
        playerRef.current = null;
      }
      setSelectedSoundId('none');
      currentSoundIdRef.current = 'none';
    }
  }, [isOpen, animatedProgress]);

  // Handle manual time change before start
  useEffect(() => {
    if (phase === PHASES.SETUP) {
      setTimeLeft(selectedMinutes * 60);
      animatedProgress.setValue(1);
    }
  }, [selectedMinutes, phase, animatedProgress]);

  // Timer logic
  useEffect(() => {
    // ─── BUG FIX: Guard against running the timer when modal is closed. ────
    // Without isOpen in deps, the interval can keep firing after modal close,
    // causing stale state updates on a hidden/unmounted modal.
    if (!isOpen) {
      return;
    }

    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (phase === PHASES.FOCUS) {
        setPhase(PHASES.FOCUS_DONE);
        const itemToComplete = isCustomFocus ? linkedItem : habit;
        if (onComplete) onComplete(itemToComplete, selectedMinutes);
      } else if (phase === PHASES.BREAK) {
        setPhase(PHASES.BREAK_DONE);
      }
    }
    return () => clearInterval(interval);
  }, [isOpen, isRunning, timeLeft, phase, onComplete, habit, linkedItem, selectedMinutes, isCustomFocus]);

  // Animation progress sync
  useEffect(() => {
    if (currentTotalSeconds > 0) {
      Animated.timing(animatedProgress, {
        toValue: timeLeft / currentTotalSeconds,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    }
  }, [timeLeft, currentTotalSeconds, animatedProgress]);

  if (!isOpen) return null;

  const strokeWidth = 12;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const toggleTimer = () => {
    if (phase === PHASES.SETUP) setPhase(PHASES.FOCUS);
    setIsRunning(!isRunning);
  };

  const startBreak = () => {
    setTimeLeft(breakMinutes * 60);
    setPhase(PHASES.BREAK);
    setIsRunning(true);
  };

  const getStatusText = () => {
    switch (phase) {
      case PHASES.SETUP: return t('focus.select_time');
      case PHASES.FOCUS: return isRunning ? t('focus.focusing') : t('focus.paused');
      case PHASES.FOCUS_DONE: return t('focus.done');
      case PHASES.BREAK: return isRunning ? t('focus.break_active') : t('focus.break_paused');
      case PHASES.BREAK_DONE: return t('focus.break_done');
      default: return '';
    }
  };

  const isGradientBreak = phase === PHASES.BREAK || phase === PHASES.BREAK_DONE;

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={28} color={theme.textMain} />
          </TouchableOpacity>

          <ScrollView 
            contentContainerStyle={styles.modalBody}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.headerTitle}>
              {isGradientBreak ? t('focus.break_mode') : t('focus.focus_mode')}
            </Text>

            {/* Focus to Do: Task Name Input (only in SETUP phase for custom focus) */}
            {isCustomFocus && phase === PHASES.SETUP ? (
              <View style={styles.focusToDoSection}>
                <Text style={styles.focusToDoLabel}>{t('focus.what_focus')}</Text>
                
                {/* Active Tasks Presets */}
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.presetRow}
                >
                  {uncompletedItems.length > 0 ? (
                    uncompletedItems.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        style={[
                          styles.presetChip,
                          linkedItem?.id === item.id && styles.presetChipActive
                        ]}
                        onPress={() => setLinkedItem(item)}
                      >
                        <Text style={[
                          styles.presetChipText,
                          linkedItem?.id === item.id && styles.presetChipTextActive
                        ]}>
                          {item.emoji || item.icon ? `${item.emoji || item.icon} ` : ''}{item.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={{ color: theme.textMuted, fontSize: 13, fontStyle: 'italic' }}>
                      No active tasks right now.
                    </Text>
                  )}
                </ScrollView>
              </View>
            ) : (
              <Text style={styles.habitName}>{displayName}</Text>
            )}

            <View style={styles.timerContainer}>
              <Svg width="280" height="280" viewBox="0 0 280 280">
                <Defs>
                  <LinearGradient id="focusGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={isGradientBreak ? (theme.success || '#10b981') : theme.accent} stopOpacity="1" />
                    <Stop offset="1" stopColor={isGradientBreak ? '#34d399' : '#8b5cf6'} stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <Circle
                  cx="140" cy="140" r={radius}
                  stroke={theme.border}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <AnimatedCircle
                  cx="140" cy="140" r={radius}
                  stroke="url(#focusGrad)"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 140 140)"
                />
              </Svg>

              <View style={styles.timeTextWrapper}>
                <Text style={styles.timeText}>
                  {formatTime(timeLeft)}
                </Text>
                <Text style={[styles.statusText, isGradientBreak && { color: theme.success || '#10b981' }]}>
                  {getStatusText()}
                </Text>
              </View>
            </View>

            {phase === PHASES.SETUP && (
              <View style={styles.customTimeContainer}>
                <TextInput
                  style={styles.customTimeInput}
                  keyboardType="numeric"
                  maxLength={3}
                  value={selectedMinutes > 0 ? selectedMinutes.toString() : ''}
                  onChangeText={(text) => {
                    const numericVal = text.replace(/[^0-9]/g, '');
                    const min = parseInt(numericVal, 10);
                    setSelectedMinutes(isNaN(min) ? 0 : min);
                  }}
                  placeholder="25"
                  placeholderTextColor={theme.textMuted}
                />
                <Text style={styles.customTimeLabel}>{t('focus.minutes_abbr')}</Text>
              </View>
            )}

            {(phase === PHASES.SETUP || phase === PHASES.FOCUS || phase === PHASES.BREAK) && (
              <TouchableOpacity
                style={[
                  styles.mainButton,
                  isRunning ? styles.pauseButton : styles.playButton,
                  isGradientBreak && !isRunning && { backgroundColor: theme.success || '#10b981' },
                  isGradientBreak && isRunning && { borderColor: theme.success || '#10b981' }
                ]}
                onPress={toggleTimer}
                activeOpacity={0.7}
              >
                <Feather
                  name={isRunning ? "pause" : "play"}
                  size={24}
                  color={isRunning ? theme.textMain : "#fff"}
                />
                <Text style={[styles.mainButtonText, isRunning && { color: theme.textMain }]}>
                  {isRunning ? t('focus.pause') : (phase === PHASES.SETUP ? t('focus.start') : t('focus.resume'))}
                </Text>
              </TouchableOpacity>
            )}

            {/* Soundscapes Selector */}
            {(phase === PHASES.FOCUS || phase === PHASES.BREAK) && (
              <View style={styles.soundCard}>
                <Text style={styles.soundCardTitle}>{t('focus.zen_sounds')}</Text>
                <View style={styles.soundRow}>
                  {[
                    { id: 'none', label: '🔇', title: t('focus.sound_none') },
                    { id: 'lofi', label: '🎹', title: t('focus.sound_lofi') },
                    { id: 'rain', label: '🌧️', title: t('focus.sound_rain') },
                    { id: 'forest', label: '🌲', title: t('focus.sound_forest') },
                    { id: 'waves', label: '🌊', title: t('focus.sound_waves') },
                  ].map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      activeOpacity={0.7}
                      style={[
                        styles.soundBtn,
                        selectedSoundId === s.id && styles.soundBtnActive
                      ]}
                      onPress={() => setSelectedSoundId(s.id)}
                    >
                      <Text style={styles.soundEmoji}>{s.label}</Text>
                      <Text style={[styles.soundBtnText, selectedSoundId === s.id && styles.soundBtnTextActive]}>
                        {s.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {phase === PHASES.FOCUS_DONE && (
              <View style={styles.successContainer}>
                <Text style={styles.successMessage}>
                  {isCustomFocus 
                    ? `🎉 "${displayName}" ${t('focus.done')}`
                    : t('focus.completed')}
                </Text>
                <TouchableOpacity activeOpacity={0.7} style={[styles.mainButton, { backgroundColor: theme.success || '#10b981' }]} onPress={startBreak}>
                  <Feather name="coffee" size={24} color="#fff" />
                  <Text style={styles.mainButtonText}>{breakMinutes} {t('focus.minutes_abbr')} Mola</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} style={styles.secondaryButton} onPress={onClose}>
                  <Text style={styles.secondaryButtonText}>{t('focus.skip_break')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {phase === PHASES.BREAK_DONE && (
              <View style={styles.successContainer}>
                <Text style={styles.successMessage}>
                  {t('focus.break_msg')}
                </Text>
                <TouchableOpacity activeOpacity={0.7} style={[styles.mainButton, { backgroundColor: theme.accent }]} onPress={onClose}>
                  <Text style={styles.mainButtonText}>{t('focus.close')}</Text>
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (theme) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    width: '100%',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  closeButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginLeft: -8,
  },
  modalBody: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 16,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  habitName: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.textMain,
    textAlign: 'center',
    marginBottom: 32,
  },
  // Focus to Do styles
  focusToDoSection: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
  },
  focusToDoLabel: {
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: '600',
    marginBottom: 12,
  },
  focusToDoInput: {
    width: '100%',
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.border,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 18,
    fontWeight: '700',
    color: theme.textMain,
    textAlign: 'center',
    marginBottom: 14,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  presetChip: {
    backgroundColor: theme.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  presetChipActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textMuted,
  },
  presetChipTextActive: {
    color: '#fff',
  },
  timerContainer: {
    width: 280,
    height: 280,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  timeTextWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: theme.textMain,
    fontVariant: ['tabular-nums'],
  },
  statusText: {
    fontSize: 16,
    color: theme.accent,
    fontWeight: '600',
    marginTop: 8,
  },
  customTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    backgroundColor: theme.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  customTimeInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.accent,
    minWidth: 50,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  customTimeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textMuted,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 32,
    minWidth: 220,
    gap: 12,
  },
  playButton: {
    backgroundColor: theme.accent,
  },
  pauseButton: {
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: theme.border,
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  secondaryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: theme.textMuted,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    width: '100%',
  },
  successMessage: {
    fontSize: 16,
    color: theme.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  soundCard: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 16,
    width: '100%',
    borderWidth: 0.5,
    borderColor: theme.border,
    marginTop: 28,
    alignItems: 'center',
  },
  soundCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  soundRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  soundBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  soundBtnActive: {
    borderColor: theme.accent,
    backgroundColor: theme.background,
  },
  soundEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  soundBtnText: {
    fontSize: 10,
    color: theme.textMuted,
    fontWeight: '600',
  },
  soundBtnTextActive: {
    color: theme.accent,
    fontWeight: '800',
  }
});
