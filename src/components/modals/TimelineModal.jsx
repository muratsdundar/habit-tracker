import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocalDateStr } from '../../utils/habitUtils';
import { useTheme } from '../../contexts/ThemeContext';
import AnimatedModalWrapper from './AnimatedModalWrapper';

export default function TimelineModal({ isOpen, onClose, allItems, todayStr, isItemDay, handleToggle, openAddModal }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  if (!isOpen) return null;

  // Filter and sort items with a targetTime scheduled for today
  const timelineItems = allItems
    .filter(item => item.targetTime && isItemDay(item, new Date()))
    .sort((a, b) => a.targetTime.localeCompare(b.targetTime));

  return (
    <AnimatedModalWrapper
      visible={isOpen}
      onClose={onClose}
      align="flex-end"
      overlayColor="rgba(0,0,0,0.7)"
    >
      <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('timeline.title')}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color={theme.textMain} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.description}>
            Tüm zamanlanmış görevlerini saat sırasına göre buradan takip et.
          </Text>

          <ScrollView style={styles.timelineContainer} showsVerticalScrollIndicator={false}>
            {timelineItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🕰️</Text>
                <Text style={styles.emptyText}>{t('home.empty_timeline')}</Text>
                <Text style={styles.emptySubText}>
                  Yeni bir görev eklerken Saat Ata alanını doldurarak görevlerini zaman çizelgesine ekleyebilirsin.
                </Text>
              </View>
            ) : (
              timelineItems.map(item => {
                const [hours, minutes] = item.targetTime.split(':').map(Number);
                const now = new Date();
                const isPast = (hours < now.getHours()) || (hours === now.getHours() && minutes < now.getMinutes());
                const isCompletedToday = (item.completedDates || []).includes(getLocalDateStr(now));
                const itemColor = item.color || theme.accent;

                return (
                  <View key={item.id} style={[styles.timelineItem, isCompletedToday && styles.timelineItemCompleted]}>
                    <View style={styles.timeColumn}>
                      <Text style={[styles.timeText, (isPast || isCompletedToday) ? styles.timeTextPast : styles.timeTextActive]}>
                        {item.targetTime}
                      </Text>
                      {!!item.endTime && (
                        <Text style={styles.endTimeText}>{item.endTime}</Text>
                      )}
                    </View>

                    <TouchableOpacity 
                      activeOpacity={0.8}
                      style={[styles.taskCard, { borderLeftColor: itemColor }]}
                      onPress={() => {
                        handleToggle(item.id, item.type);
                      }}
                    >
                      <Text style={styles.emoji}>{item.emoji}</Text>
                      <Text style={[styles.taskName, isCompletedToday && styles.taskNameCompleted]} numberOfLines={2}>
                        {item.name}
                      </Text>
                      
                      <View style={styles.actionsRow}>
                        <TouchableOpacity 
                          activeOpacity={0.7}
                          style={styles.editBtn} 
                          onPress={(e) => {
                            e.stopPropagation();
                            onClose();
                            openAddModal(item.type, item);
                          }}
                        >
                          <Feather name="edit-2" size={16} color={theme.textMuted} />
                        </TouchableOpacity>

                        <View style={[styles.checkbox, isCompletedToday && { backgroundColor: itemColor, borderColor: itemColor }]}>
                          {isCompletedToday && <Feather name="check" size={16} color={theme.card} />}
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
    </AnimatedModalWrapper>
  );
}

const getStyles = (theme) => StyleSheet.create({
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    marginHorizontal: 12,
    marginBottom: 12,
    maxHeight: '80%',
    padding: 24,
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderTopColor: theme.border,
    borderLeftColor: theme.border,
    borderRightColor: theme.border,
    paddingBottom: 20,
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
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textMain,
  },
  closeBtn: {
    padding: 4,
  },
  description: {
    color: theme.textMuted,
    fontSize: 13,
    marginBottom: 24,
  },
  timelineContainer: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyText: {
    color: theme.textMuted,
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubText: {
    color: theme.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  timelineItemCompleted: {
    opacity: 0.5,
  },
  timeColumn: {
    width: 50,
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  timeTextActive: {
    color: theme.accent, // Accent color
  },
  timeTextPast: {
    color: theme.textTertiary,
  },
  endTimeText: {
    fontSize: 11,
    color: theme.textTertiary,
    marginTop: 2,
  },
  taskCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderWidth: 0.5,
    borderColor: theme.border,
    borderRadius: 24,
    borderLeftWidth: 4,
    padding: 16,
    gap: 12,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  emoji: {
    fontSize: 24,
  },
  taskName: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.textMain,
  },
  taskNameCompleted: {
    textDecorationLine: 'line-through',
    color: theme.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editBtn: {
    padding: 4,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8, // squircle for checkbox
    borderWidth: 2,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
