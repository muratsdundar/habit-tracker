import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

// Faz 4: React.memo kullanılarak gereksiz re-render'lar önleniyor
const HabitListItem = React.memo(({ item, isDone, streak, isRelevantDay, typeLabel, onToggle, onEdit, onFocus }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);
  const itemColor = item.color || theme.textMuted;

  return (
    <TouchableOpacity 
      style={[
        styles.listItem, 
        isDone && styles.listItemSelected,
        !isRelevantDay && { opacity: 0.4 }
      ]}
      activeOpacity={0.7}
      onPress={() => onToggle(item.id, item.type)}
    >
      <View style={styles.listTopRow}>
        <View style={[styles.checkbox, isDone && { backgroundColor: itemColor, borderColor: itemColor }]}>
          {isDone && <Feather name="check" size={16} color={theme.card} />}
        </View>
        <View style={styles.actionsRow}>
          {!isDone && (
            <TouchableOpacity activeOpacity={0.7} style={styles.actionBtn} onPress={() => onFocus && onFocus(item)}>
              <Feather name="play-circle" size={20} color={theme.accent} />
            </TouchableOpacity>
          )}

          <TouchableOpacity activeOpacity={0.7} style={styles.actionBtn} onPress={() => onEdit(item.type, item)}>
            <Feather name="edit-2" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.itemContent}>
        {!!item.emoji && <Text style={styles.emojiText}>{item.emoji}</Text>}
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        {!!item.targetTime && (
          <Text style={styles.timeText}>
            <Feather name="clock" size={12} /> {item.targetTime}{item.endTime ? ` - ${item.endTime}` : ''}
          </Text>
        )}
      </View>

      <View style={styles.tagsRow}>
        <Text style={styles.tagTextLabel}>{typeLabel}</Text>
        {!!item.category && (
          <View style={styles.categoryTag}>
            <View style={[styles.categoryDot, { backgroundColor: itemColor }]} />
            <Text style={styles.categoryTagText}>{item.category}</Text>
          </View>
        )}
        {streak > 0 && (
          <View style={[styles.streakBadge, streak >= 3 && styles.streakBadgeHot]}>
            <Text style={styles.streakText}>🔥 {streak}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Sadece değişen proplarda re-render yap (Optimizasyon)
  return prevProps.isDone === nextProps.isDone &&

         prevProps.streak === nextProps.streak &&
         prevProps.isRelevantDay === nextProps.isRelevantDay &&
         prevProps.item.name === nextProps.item.name &&
         prevProps.item.emoji === nextProps.item.emoji &&
         prevProps.item.color === nextProps.item.color;
});

HabitListItem.displayName = 'HabitListItem';

export default HabitListItem;

const getStyles = (theme) => StyleSheet.create({
  listItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.card,
    borderRadius: theme.radii?.lg || 24, // Squircle
    padding: theme.spacing?.lg || 20,
    marginBottom: theme.spacing?.md || 16,
    borderWidth: 0.5,
    borderColor: theme.border,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  listItemSelected: {
    backgroundColor: theme.background,
    borderColor: theme.border,
  },
  listTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: -8,
  },
  actionBtn: {
    padding: 8,
  },
  itemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emojiText: {
    fontSize: 32,
    marginBottom: 12,
  },
  itemName: {
    fontFamily: theme.fonts?.semiBold,
    fontSize: 18,
    color: theme.textMain,
    textAlign: 'center',
  },
  timeText: {
    color: theme.textMuted, 
    fontSize: 12, 
    marginTop: 4, 
    fontWeight: '500'
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagTextLabel: {
    fontFamily: theme.fonts?.semiBold,
    color: theme.textMuted,
    fontSize: 12,
    backgroundColor: theme.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  categoryTagText: {
    fontFamily: theme.fonts?.medium,
    color: theme.textMuted,
    fontSize: 12,
  },
  streakBadge: {
    backgroundColor: theme.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  streakBadgeHot: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
  },
  streakText: {
    fontFamily: theme.fonts?.bold,
    color: theme.textMain,
    fontSize: 12,
  }
});
