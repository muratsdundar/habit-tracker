import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import AnimatedModalWrapper from './AnimatedModalWrapper';

const MOODS = [
  { id: 'great', emoji: '😊', labelKey: 'mood.great', color: '#10b981' },
  { id: 'normal', emoji: '😐', labelKey: 'mood.normal', color: '#3b82f6' },
  { id: 'struggled', emoji: '😫', labelKey: 'mood.struggled', color: '#f59f00' },
];

export default function MoodReflectionModal({ isOpen, onClose, item, targetDate, onSave }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const initialMood = item?.moodLogs?.[targetDate]?.mood || 'great';
  const initialNote = item?.moodLogs?.[targetDate]?.note || '';

  const [selectedMood, setSelectedMood] = useState(initialMood);
  const [note, setNote] = useState(initialNote);

  if (!isOpen || !item) return null;

  const handleSave = () => {
    if (onSave) {
      onSave(item.id, item.type, targetDate, {
        mood: selectedMood,
        note: note.trim(),
        timestamp: Date.now()
      });
    }
    onClose();
  };

  return (
    <AnimatedModalWrapper visible={isOpen} onClose={onClose} align="flex-end">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              {!!item.emoji && <Text style={styles.itemEmoji}>{item.emoji}</Text>}
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color={theme.textMain} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{t('mood.title')}</Text>
          <Text style={styles.subtitle}>{t('mood.subtitle')}</Text>

          {/* Mood Options */}
          <View style={styles.moodRow}>
            {MOODS.map(m => {
              const isSelected = selectedMood === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  activeOpacity={0.7}
                  style={[
                    styles.moodCard,
                    isSelected && { borderColor: m.color, backgroundColor: m.color + '15' }
                  ]}
                  onPress={() => setSelectedMood(m.id)}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, isSelected && { color: m.color, fontWeight: '700' }]}>
                    {t(m.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Note Input */}
          <TextInput
            style={styles.noteInput}
            placeholder={t('mood.note_placeholder')}
            placeholderTextColor={theme.textMuted + '80'}
            value={note}
            onChangeText={setNote}
            maxLength={140}
            multiline
          />

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
              <Text style={styles.skipBtnText}>{t('mood.skip')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{t('mood.save')}</Text>
            </TouchableOpacity>
          </View>
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
    borderTopLeftRadius: theme.radii?.xl || 36,
    borderTopRightRadius: theme.radii?.xl || 36,
    borderBottomLeftRadius: theme.radii?.xl || 36,
    borderBottomRightRadius: theme.radii?.xl || 36,
    marginHorizontal: 12,
    marginBottom: 12,
    maxHeight: '85%',
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
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  itemEmoji: {
    fontSize: 24,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textMain,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.textMain,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 20,
  },
  moodRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  moodCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: theme.radii?.lg || 20,
    backgroundColor: theme.background,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: '600',
  },
  noteInput: {
    backgroundColor: theme.background,
    borderRadius: theme.radii?.md || 16,
    padding: 14,
    color: theme.textMain,
    fontSize: 14,
    minHeight: 70,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: theme.border,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.radii?.lg || 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  skipBtnText: {
    color: theme.textMuted,
    fontWeight: '600',
    fontSize: 15,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: theme.radii?.lg || 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
