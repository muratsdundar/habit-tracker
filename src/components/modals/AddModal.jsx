import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocalDateStr } from '../../utils/habitUtils';
import { useAsyncStorage } from '../../hooks/useAsyncStorage';
import { useTheme } from '../../contexts/ThemeContext';
import AnimatedModalWrapper from './AnimatedModalWrapper';

const COLORS = ['#ef4444', '#f97316', '#f59f00', '#10b981', '#3b82f6', '#6366f1', '#d946ef'];
const EMOJIS = ['🪥', '🧴', '🎯', '🏃‍♂️', '💧', '🧘‍♂️', '📚', '💻', '🍎', '💤', '🏋️‍♂️', '🎵', '🎨', '🚀', '🗑️', '❤️', '🔥', '✨', '☕', '💡', '🏆', '🎮', '⚽', '🚗', '✈️', '🐶', '🐱', '🍔', '🍕'];

export default function AddModal({ visible, onClose, initialType = 'habit', itemToEdit, onSave, onDelete, existingItems = [] }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  const [activeType, setActiveType] = useState(initialType);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formColor, setFormColor] = useState(COLORS[4]);
  const [formEmoji, setFormEmoji] = useState(EMOJIS[0]);
  
  // New State variables
  const [formInitialStreak, setFormInitialStreak] = useState('0');
  const [formFreqType, setFormFreqType] = useState('daily');
  const [formSelectedDays, setFormSelectedDays] = useState([]);
  const [formSelectedDates, setFormSelectedDates] = useState([]);
  const [formSelectedMonths, setFormSelectedMonths] = useState([]);
  const [isInstantTask, setIsInstantTask] = useState(false);
  const [formTargetTime, setFormTargetTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formTimeBlock, setFormTimeBlock] = useState('anytime');

  // Notification States
  const [formNotificationsEnabled, setFormNotificationsEnabled] = useState(false);
  const [formNotificationTimes, setFormNotificationTimes] = useState([]);
  const [newTimeInput, setNewTimeInput] = useState('');
  const [timeError, setTimeError] = useState('');

  // Emoji States
  const [favoriteEmojis, setFavoriteEmojis] = useAsyncStorage('habit-tracker-favorite-emojis', []);
  const [showCustomEmojiInput, setShowCustomEmojiInput] = useState(false);

  const displayEmojis = [...new Set([...(favoriteEmojis || []), ...EMOJIS])];

  const recentCategories = useMemo(() => {
    const cats = [];
    const seen = new Set();
    existingItems.forEach(item => {
      if (item.category && item.category.trim() !== '') {
        const catName = item.category.trim();
        if (!seen.has(catName.toLowerCase())) {
          seen.add(catName.toLowerCase());
          cats.push({ name: catName, color: item.color, emoji: item.emoji });
        }
      }
    });
    return cats.slice(0, 15);
  }, [existingItems]);

  useEffect(() => {
    if (visible) {
      if (itemToEdit) {
        setActiveType(itemToEdit?.type ?? initialType);
        setFormName(itemToEdit?.name ?? '');
        setFormCategory(itemToEdit?.category ?? '');
        setFormColor(itemToEdit?.color ?? COLORS[4]);
        setFormEmoji(itemToEdit?.emoji ?? EMOJIS[0]);
        
        setFormInitialStreak(String(itemToEdit?.initialStreak ?? 0));
        setFormFreqType(itemToEdit?.freqType ?? 'daily');
        setIsInstantTask(itemToEdit?.freqType === 'instant');
        setFormTargetTime(itemToEdit?.targetTime ?? '');
        setFormEndTime(itemToEdit?.endTime ?? '');
        setFormNotificationsEnabled(itemToEdit?.notificationsEnabled ?? false);
        setFormNotificationTimes(itemToEdit?.notificationTimes ?? []);
        setNewTimeInput('');
        setTimeError('');
        setFormTimeBlock(itemToEdit?.timeBlock ?? 'anytime');
        
        if (itemToEdit?.freqType === 'weekly') setFormSelectedDays(itemToEdit?.freqValues ?? []);
        else if (itemToEdit?.freqType === 'monthly') setFormSelectedDates(itemToEdit?.freqValues ?? []);
        else if (itemToEdit?.freqType === 'yearly') setFormSelectedMonths(itemToEdit?.freqValues ?? []);
        else {
          setFormSelectedDays([]);
          setFormSelectedDates([]);
          setFormSelectedMonths([]);
        }
      } else {
        setActiveType(initialType);
        setFormName('');
        setFormCategory('');
        setFormColor(COLORS[4]);
        setFormEmoji(EMOJIS[0]);
        
        setFormInitialStreak('0');
        setFormFreqType('daily');
        setFormSelectedDays([]);
        setFormSelectedDates([]);
        setFormSelectedMonths([]);
        setIsInstantTask(false);
        setFormTargetTime('');
        setFormEndTime('');
        setFormNotificationsEnabled(false);
        setFormNotificationTimes([]);
        setNewTimeInput('');
        setTimeError('');
        setShowCustomEmojiInput(false);
        setFormTimeBlock('anytime');
      }
    }
  }, [visible, itemToEdit, initialType]);

  const toggleFavoriteEmoji = () => {
    const isFav = favoriteEmojis.includes(formEmoji);
    if (isFav) {
      setFavoriteEmojis(favoriteEmojis.filter(e => e !== formEmoji));
    } else {
      setFavoriteEmojis([...favoriteEmojis, formEmoji]);
    }
  };

  const handleSave = () => {
    if (!formName.trim()) return;

    let finalFreqType = activeType === 'task' && isInstantTask ? 'instant' : formFreqType;
    let finalFreqValues = [];
    if (finalFreqType === 'weekly') finalFreqValues = formSelectedDays;
    if (finalFreqType === 'monthly') finalFreqValues = formSelectedDates;
    if (finalFreqType === 'yearly') finalFreqValues = formSelectedMonths;

    const newItem = {
      ...(itemToEdit ?? {}),
      id: itemToEdit?.id ?? Date.now(),
      type: activeType,
      name: formName.trim(),
      category: formCategory.trim(),
      color: formColor,
      emoji: formEmoji,
      freqType: finalFreqType,
      freqValues: finalFreqValues,
      targetTime: formTargetTime.trim(),
      endTime: formEndTime.trim(),
      timeBlock: formTimeBlock,
      initialStreak: parseInt(formInitialStreak) || 0,
      notificationsEnabled: formNotificationsEnabled,
      notificationTimes: formNotificationsEnabled ? formNotificationTimes : [],
      createdAtDate: itemToEdit?.createdAtDate ?? getLocalDateStr(), // Used to hide instant tasks on other days
    };

    if (!itemToEdit) {
      newItem.completedDates = [];
    } else {
      newItem.completedDates = itemToEdit?.completedDates ?? [];
    }

    if (newItem.initialStreak > 0) {
      const backfillDates = [...newItem.completedDates];
      const today = new Date();
      for (let i = 1; i <= newItem.initialStreak; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dStr = `${year}-${month}-${day}`;
        if (!backfillDates.includes(dStr)) {
          backfillDates.push(dStr);
        }
      }
      newItem.completedDates = backfillDates;
      newItem.initialStreak = 0; // Reset so calculateStreak doesn't double count
    }

    onSave(newItem, !!itemToEdit);
  };

  const toggleArrayItem = (arr, setArr, item) => {
    if (arr.includes(item)) setArr(arr.filter(i => i !== item));
    else setArr([...arr, item]);
  };

  const handleAddNotificationTime = () => {
    const formatted = newTimeInput.trim();
    if (!formatted) return;

    const match = formatted.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    if (!match) {
      setTimeError(t('modal.invalid_time'));
      setTimeout(() => setTimeError(''), 3000);
      return;
    }

    const hour = match[1].padStart(2, '0');
    const minute = match[2];
    const finalTime = `${hour}:${minute}`;

    if (formNotificationTimes.includes(finalTime)) {
      setNewTimeInput('');
      return;
    }

    setFormNotificationTimes([...formNotificationTimes, finalTime].sort());
    setNewTimeInput('');
    setTimeError('');
  };

  const handleRemoveNotificationTime = (timeToRemove) => {
    setFormNotificationTimes(formNotificationTimes.filter(t => t !== timeToRemove));
  };

  return (
    <AnimatedModalWrapper visible={visible} onClose={onClose} align="flex-end">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {itemToEdit ? t('modal.edit_title') : (activeType === 'task' ? t('modal.add_new_task') : t('modal.add_new_habit'))}
            </Text>
            <View style={styles.headerActions}>
              {!!itemToEdit && (
                <TouchableOpacity activeOpacity={0.7} onPress={() => onDelete(itemToEdit)} style={styles.deleteBtn}>
                  <Feather name="trash-2" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
              <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={24} color={theme.textMain} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            
            {/* Segmented Control */}
            <View style={styles.segmentControl}>
              <TouchableOpacity 
                style={[styles.segmentBtn, activeType === 'habit' && styles.segmentBtnActive]}
                onPress={() => setActiveType('habit')}
              >
                <Text style={[styles.segmentText, activeType === 'habit' && styles.segmentTextActive]}>{t('modal.habit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.segmentBtn, activeType === 'task' && styles.segmentBtnActive]}
                onPress={() => setActiveType('task')}
              >
                <Text style={[styles.segmentText, activeType === 'task' && styles.segmentTextActive]}>{t('modal.task')}</Text>
              </TouchableOpacity>
            </View>

            {/* Emojis */}
            <View style={styles.emojiHeader}>
              <Text style={styles.label}>{t('modal.icon_label')}</Text>
              <TouchableOpacity onPress={toggleFavoriteEmoji} style={styles.favToggleBtn}>
                <Feather 
                  name="star" 
                  size={20} 
                  color={favoriteEmojis.includes(formEmoji) ? '#f59f00' : '#64748b'} 
                  style={favoriteEmojis.includes(formEmoji) ? styles.favIconActive : {}}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.emojiRowContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
                {displayEmojis.map(emoji => (
                  <TouchableOpacity 
                    key={emoji} 
                    style={[styles.emojiBtn, formEmoji === emoji && styles.emojiBtnSelected]}
                    onPress={() => setFormEmoji(emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                    {favoriteEmojis.includes(emoji) && (
                      <View style={styles.favDot} />
                    )}
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity 
                  style={styles.emojiBtnAdd}
                  onPress={() => setShowCustomEmojiInput(!showCustomEmojiInput)}
                >
                  <Feather name={showCustomEmojiInput ? "minus" : "plus"} size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </ScrollView>
            </View>

            {showCustomEmojiInput && (
              <View style={styles.customEmojiContainer}>
                <Text style={styles.customEmojiLabel}>Klavye ile girin:</Text>
                <TextInput
                  style={styles.customEmojiInput}
                  value={formEmoji}
                  onChangeText={(text) => {
                    if (text.length > 0) {
                      // Grab the last character entered as emoji
                      const charArray = Array.from(text);
                      setFormEmoji(charArray[charArray.length - 1]);
                    }
                  }}
                  autoFocus={true}
                  selectionColor={theme.accent}
                  placeholder="😀"
                  placeholderTextColor={theme.textTertiary}
                />
              </View>
            )}

            <TextInput 
              style={styles.input}
              placeholder={t('modal.name_placeholder')}
              placeholderTextColor={theme.textTertiary}
              value={formName}
              onChangeText={setFormName}
            />

            {!isInstantTask && (
              <View>
                <TextInput 
                  style={styles.input}
                  placeholder={t('modal.category_placeholder')}
                  placeholderTextColor={theme.textTertiary}
                  value={formCategory}
                  onChangeText={setFormCategory}
                />
                {recentCategories.length > 0 && (
                  <View style={styles.recentCategoriesContainer}>
                    <Text style={styles.recentCategoriesLabel}>Önceki Kategoriler:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentCategoriesScroll}>
                      {recentCategories.map((cat, idx) => (
                        <TouchableOpacity 
                          key={idx}
                          style={[styles.catChip, { borderColor: cat.color }]}
                          onPress={() => {
                            setFormCategory(cat.name);
                            if (cat.color) setFormColor(cat.color);
                          }}
                        >
                          <Text style={styles.catChipText}>{cat.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {/* Instant Task Toggle */}
            {activeType === 'task' && (
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t('modal.instant_task')}</Text>
                <Switch
                  value={isInstantTask}
                  onValueChange={setIsInstantTask}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor={theme.card}
                />
              </View>
            )}

            {isInstantTask && (
              <View style={styles.instantTaskInfo}>
                <Feather name="info" size={16} color={theme.accent} />
                <Text style={styles.instantTaskInfoText}>
                  {t('add.instant_desc')}
                </Text>
              </View>
            )}

            {/* Time Block Settings */}
            <View style={styles.freqContainer}>
              <Text style={styles.label}>Günün Hangi Vakti?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.freqScroll}>
                {[{id: 'anytime', label: 'Tüm Gün'}, {id: 'morning', label: '🌅 Sabah'}, {id: 'afternoon', label: '☀️ Öğle'}, {id: 'evening', label: '🌙 Akşam'}].map(tb => (
                  <TouchableOpacity 
                    key={tb.id}
                    style={[styles.pillBtn, formTimeBlock === tb.id && styles.pillBtnSelected]}
                    onPress={() => setFormTimeBlock(tb.id)}
                  >
                    <Text style={[styles.pillText, formTimeBlock === tb.id && styles.pillTextSelected]}>
                      {tb.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Frequency Settings */}
            {!(activeType === 'task' && isInstantTask) && (
              <View style={styles.freqContainer}>
                <Text style={styles.label}>{t('modal.frequency')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.freqScroll}>
                  {['daily', 'weekly', 'monthly', 'yearly'].map(ft => (
                    <TouchableOpacity 
                      key={ft}
                      style={[styles.pillBtn, formFreqType === ft && styles.pillBtnSelected]}
                      onPress={() => setFormFreqType(ft)}
                    >
                      <Text style={[styles.pillText, formFreqType === ft && styles.pillTextSelected]}>
                        {t(`modal.freq.${ft}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {formFreqType === 'weekly' && (
                  <View style={styles.subFreqBox}>
                    <Text style={styles.subLabel}>{t('modal.select_days')}</Text>
                  <View style={styles.gridDays}>
                    {[1,2,3,4,5,6,7].map(d => (
                      <TouchableOpacity 
                        key={d} 
                        style={[styles.gridBtnDay, formSelectedDays.includes(d) && styles.gridBtnSelected]}
                        onPress={() => toggleArrayItem(formSelectedDays, setFormSelectedDays, d)}
                      >
                        <Text style={[styles.gridTextDay, formSelectedDays.includes(d) && styles.gridTextSelected]} numberOfLines={1} adjustsFontSizeToFit>{t(`day.${d}`)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  </View>
                )}

                {formFreqType === 'monthly' && (
                  <View style={styles.subFreqBox}>
                    <Text style={styles.subLabel}>{t('modal.select_dates')}</Text>
                    <View style={styles.grid}>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <TouchableOpacity 
                          key={d} 
                          style={[styles.gridBtnNum, formSelectedDates.includes(d) && styles.gridBtnSelected]}
                          onPress={() => toggleArrayItem(formSelectedDates, setFormSelectedDates, d)}
                        >
                          <Text style={[styles.gridText, formSelectedDates.includes(d) && styles.gridTextSelected]}>{d}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {formFreqType === 'yearly' && (
                  <View style={styles.subFreqBox}>
                    <Text style={styles.subLabel}>{t('modal.select_months')}</Text>
                    <View style={styles.grid}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <TouchableOpacity 
                          key={m} 
                          style={[styles.gridBtn, formSelectedMonths.includes(m) && styles.gridBtnSelected]}
                          onPress={() => toggleArrayItem(formSelectedMonths, setFormSelectedMonths, m)}
                        >
                          <Text style={[styles.gridText, formSelectedMonths.includes(m) && styles.gridTextSelected]}>{t(`month.${m}`)}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Time Settings */}
            {!isInstantTask && (
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>{t('modal.start_time')}</Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="08:00"
                    placeholderTextColor={theme.textTertiary}
                    value={formTargetTime}
                    onChangeText={setFormTargetTime}
                    maxLength={5}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>{t('modal.end_time')}</Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="08:30"
                    placeholderTextColor={theme.textTertiary}
                    value={formEndTime}
                    onChangeText={setFormEndTime}
                    maxLength={5}
                  />
                </View>
              </View>
            )}

            {/* Initial Streak */}
            {!isInstantTask && (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.label}>{t('modal.initial_streak')}</Text>
                <TextInput 
                  style={styles.input}
                  keyboardType="numeric"
                  value={formInitialStreak}
                  onChangeText={setFormInitialStreak}
                />
              </View>
            )}

            {/* Notification Reminders */}
            <View style={styles.notificationSection}>
              <View style={styles.switchRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.switchLabel}>{t('modal.notifications_enable')}</Text>
                </View>
                <Switch
                  value={formNotificationsEnabled}
                  onValueChange={setFormNotificationsEnabled}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor={theme.card}
                />
              </View>

              {formNotificationsEnabled && (
                <View style={styles.notificationDetails}>
                  <Text style={styles.subLabel}>{t('modal.notification_times')}</Text>
                  
                  {/* Time Chips */}
                  {formNotificationTimes.length > 0 ? (
                    <View style={styles.timeChipsContainer}>
                      {formNotificationTimes.map(time => (
                        <View key={time} style={styles.timeChip}>
                          <Feather name="clock" size={12} color={theme.accent} style={{ marginRight: 4 }} />
                          <Text style={styles.timeChipText}>{time}</Text>
                          <TouchableOpacity 
                            onPress={() => handleRemoveNotificationTime(time)}
                            style={styles.deleteTimeBtn}
                          >
                            <Feather name="x" size={12} color={theme.textMuted} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {/* Add Time Row */}
                  <View style={styles.timeInputRow}>
                    <TextInput
                      style={[styles.input, styles.timeInput]}
                      placeholder={t('modal.time_placeholder')}
                      placeholderTextColor={theme.textTertiary}
                      value={newTimeInput}
                      onChangeText={setNewTimeInput}
                      maxLength={5}
                      keyboardType="numbers-and-punctuation"
                    />
                    <TouchableOpacity 
                      style={styles.addTimeBtn}
                      onPress={handleAddNotificationTime}
                      activeOpacity={0.7}
                    >
                      <Feather name="plus" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  {!!timeError && (
                    <Text style={styles.errorText}>{timeError}</Text>
                  )}
                </View>
              )}
            </View>

            {/* Colors */}
            <Text style={styles.label}>{t('modal.color_label')}</Text>
            <View style={styles.colorRow}>
              {COLORS.map(c => (
                <TouchableOpacity 
                  key={c}
                  style={[styles.colorCircle, { backgroundColor: c }, formColor === c && styles.colorCircleSelected]}
                  onPress={() => setFormColor(c)}
                />
              ))}
            </View>

            <TouchableOpacity activeOpacity={0.7} style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{t('modal.save')}</Text>
            </TouchableOpacity>
            
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </AnimatedModalWrapper>
  );
}

const getStyles = (theme) => StyleSheet.create({
  keyboardView: {
    width: '100%',
    flexShrink: 1,
  },
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    marginHorizontal: 12,
    marginBottom: 12,
    maxHeight: '90%',
    flexShrink: 1,
    padding: 24,
    borderWidth: 0.5,
    borderColor: theme.border,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.textMain,
    letterSpacing: -0.5,
  },
  closeBtn: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  body: {
    marginBottom: 20,
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: theme.background,
    borderRadius: 24,
    padding: 4,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  segmentBtnActive: {
    backgroundColor: theme.accent,
  },
  segmentText: {
    color: theme.textMuted,
    fontWeight: 'bold',
  },
  segmentTextActive: {
    color: '#fff',
  },
  label: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  emojiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  favToggleBtn: {
    padding: 4,
  },
  favIconActive: {
    fill: '#f59f00',
  },
  emojiRowContainer: {
    marginBottom: 16,
  },
  emojiRow: {
    flexDirection: 'row',
  },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiBtnSelected: {
    borderColor: theme.accent,
    backgroundColor: theme.accent + '33',
  },
  emojiBtnAdd: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
  },
  emojiText: {
    fontSize: 22,
  },
  favDot: {
    position: 'absolute',
    bottom: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59f00',
  },
  customEmojiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  customEmojiLabel: {
    color: theme.textMuted,
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
  customEmojiInput: {
    backgroundColor: theme.background,
    color: theme.textMain,
    fontSize: 24,
    width: 60,
    height: 50,
    textAlign: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.accent,
  },
  colorsContainer: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 16,
    color: theme.textMain,
    fontSize: 16,
  },
  input: {
    backgroundColor: theme.background,
    borderRadius: 16,
    padding: 16,
    color: theme.textMain,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.background,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  switchLabel: {
    color: theme.textMain,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  instantTaskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.accent + '1A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  instantTaskInfoText: {
    color: theme.textMuted,
    fontSize: 13,
    flex: 1,
  },
  freqContainer: {
    marginBottom: 16,
  },
  freqScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  pillBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.background,
    borderRadius: 24,
    marginRight: 8,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  pillBtnSelected: {
    backgroundColor: theme.accent + '33',
    borderColor: theme.accent,
  },
  pillText: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: theme.accent,
    fontWeight: 'bold',
  },
  subFreqBox: {
    backgroundColor: theme.background,
    padding: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  subLabel: {
    color: theme.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  gridBtnDay: {
    paddingVertical: 8,
    flex: 1,
    marginHorizontal: 2,
    backgroundColor: theme.card,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTextDay: {
    color: theme.textMain,
    fontSize: 12,
  },
  gridBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.card,
    borderRadius: 8,
  },
  gridBtnNum: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 18,
  },
  gridBtnSelected: {
    backgroundColor: theme.accent,
  },
  gridText: {
    color: theme.textMuted,
    fontSize: 12,
  },
  gridTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfInput: {
    flex: 1,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorCircleSelected: {
    borderColor: theme.textMain,
  },
  saveBtn: {
    backgroundColor: theme.success,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 0,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  recentCategoriesContainer: {
    marginBottom: 16,
  },
  recentCategoriesLabel: {
    color: theme.textTertiary,
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  recentCategoriesScroll: {
    flexDirection: 'row',
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  catChipEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  catChipText: {
    color: theme.textMain,
    fontSize: 13,
    fontWeight: '500',
  },
  notificationSection: {
    marginBottom: 20,
    backgroundColor: theme.background,
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  notificationDetails: {
    marginTop: 12,
    borderTopWidth: 0.5,
    borderColor: theme.border,
    paddingTop: 12,
  },
  timeChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderWidth: 0.5,
    borderColor: theme.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textMain,
    marginRight: 6,
  },
  deleteTimeBtn: {
    padding: 2,
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  timeInput: {
    flex: 1,
    marginBottom: 0,
    height: 44,
    paddingVertical: 10,
  },
  addTimeBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
});
