import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Path, Line, Circle, G } from 'react-native-svg';
import { catmullRom2bezier } from '../../utils/chartUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import AnimatedModalWrapper from './AnimatedModalWrapper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GraphModal({ 
  isOpen, 
  onClose, 
  dailyData, 
  graphMaxCount, 
  selectedGraphDate, 
  setSelectedGraphDate, 
  allItems, 
  todayStr, 
  isItemDay,
  isItemAvailable,
  onToggle
}) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  if (!isOpen) return null;

  const SVG_WIDTH = SCREEN_WIDTH - 48; // padding 24 on each side
  const SVG_HEIGHT = 100;
  
  const points = dailyData.map((d, i) => {
    const x = (i / 6) * SVG_WIDTH;
    const y = SVG_HEIGHT - ((d.count / Math.max(1, graphMaxCount)) * (SVG_HEIGHT - 12));
    return { x, y };
  });
  
  const linePath = catmullRom2bezier(points);
  const areaPath = `${linePath} L ${SVG_WIDTH},${SVG_HEIGHT} L 0,${SVG_HEIGHT} Z`;

  // Get day details
  const targetDateObj = new Date(selectedGraphDate);
  const scheduledForDay = allItems.filter(item => isItemAvailable ? isItemAvailable(item, targetDateObj) : isItemDay(item, targetDateObj));
  const completed = scheduledForDay.filter(item => (item.completedDates || []).includes(selectedGraphDate));
  const missed = scheduledForDay.filter(item => !(item.completedDates || []).includes(selectedGraphDate));
  
  const selectedDayLabel = dailyData.find(d => d.dateStr === selectedGraphDate)?.dayName || selectedGraphDate;
  const isSelectedToday = selectedGraphDate === todayStr;

  return (
    // ─── FIX: Replaced raw <Modal animationType="slide"> with AnimatedModalWrapper ──
    // Raw Modal inside HomePage's SectionList caused iOS touch system to freeze
    // after dismissal. AnimatedModalWrapper uses proper root-level Modal with
    // guaranteed cleanup via setTimeout safety net.
    <AnimatedModalWrapper
      visible={isOpen}
      onClose={onClose}
      align="flex-end"
      overlayColor="rgba(0,0,0,0.5)"
    >
      <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={2} adjustsFontSizeToFit>{t('perf.title')}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.textMain} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* The Graph */}
            <View style={styles.graphContainer}>
              <Text style={styles.graphTitle}>{t('perf.last_7_days')}</Text>
              
              <View style={{ marginTop: 24, width: '100%', alignItems: 'center' }}>
                <Svg width={SVG_WIDTH} height={SVG_HEIGHT + 10} viewBox={`-10 0 ${SVG_WIDTH + 20} ${SVG_HEIGHT + 10}`}>
                  <Defs>
                    <LinearGradient id="areaGradientModal" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor={theme.accent} stopOpacity="0.6" />
                      <Stop offset="50%" stopColor={theme.accent} stopOpacity="0.15" />
                      <Stop offset="100%" stopColor={theme.accent} stopOpacity="0.0" />
                    </LinearGradient>
                  </Defs>
                  
                  {/* Grid Lines */}
                  <Line x1="0" y1="0" x2="0" y2={SVG_HEIGHT} stroke={theme.border} strokeWidth="1" opacity="0.3" strokeLinecap="round" />
                  <Line x1="0" y1={SVG_HEIGHT} x2={SVG_WIDTH} y2={SVG_HEIGHT} stroke={theme.border} strokeWidth="1" opacity="0.3" strokeLinecap="round" />
                  <Line x1="0" y1={SVG_HEIGHT/2} x2={SVG_WIDTH} y2={SVG_HEIGHT/2} stroke={theme.border} strokeWidth="1" strokeDasharray="4 4" />

                  {/* Paths */}
                  <Path d={areaPath} fill="url(#areaGradientModal)" />
                  <Path d={linePath} fill="none" stroke={theme.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Points */}
                  {dailyData.map((d, i) => {
                    const x = (i / 6) * SVG_WIDTH;
                    const y = SVG_HEIGHT - ((d.count / Math.max(1, graphMaxCount)) * (SVG_HEIGHT - 12));
                    const isSelected = selectedGraphDate === d.dateStr;
                    return (
                      <G 
                        key={i} 
                        onPress={Platform.OS === 'web' ? undefined : () => setSelectedGraphDate(d.dateStr)}
                        onClick={Platform.OS === 'web' ? () => setSelectedGraphDate(d.dateStr) : undefined}
                      >
                        <Circle cx={x} cy={y} r="20" fill="transparent" />
                        {/* Glowing effect for selected node */}
                        {isSelected && <Circle cx={x} cy={y} r="12" fill={theme.accent} opacity="0.3" />}
                        <Circle 
                          cx={x} 
                          cy={y} 
                          r={isSelected ? "7" : "5"} 
                          fill={theme.background} 
                          stroke={theme.accent} 
                          strokeWidth={isSelected ? "4" : "2.5"} 
                        />
                      </G>
                    );
                  })}
                </Svg>
                
                {/* X Axis Labels */}
                <View style={styles.xAxisContainer}>
                  {dailyData.map((d, i) => {
                    const isSelected = selectedGraphDate === d.dateStr;
                    return (
                      <TouchableOpacity 
                        key={i} 
                        onPress={() => setSelectedGraphDate(d.dateStr)}
                        style={[
                          styles.xAxisLabelContainer,
                          { left: `${(i / 6) * 100}%` },
                          isSelected && styles.xAxisLabelContainerSelected
                        ]}
                      >
                        <Text style={[
                          styles.xAxisLabel,
                          isSelected && styles.xAxisLabelSelected
                        ]}>
                          {d.dayName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Day Details */}
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>
                {isSelectedToday ? t('perf.summary_of_today') : t('perf.summary_of_day', { day: selectedDayLabel }).replace('{day}', selectedDayLabel)}
              </Text>
              
              {/* Tamamlananlar */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.dot, { backgroundColor: theme.success }]} />
                  <Text style={styles.sectionTitle}>Tamamlananlar ({completed.length})</Text>
                </View>
                
                {completed.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Bu gün için tamamlanan görev yok.</Text>
                  </View>
                ) : (
                  <View style={styles.listContainer}>
                    {completed.map(item => {
                      const moodMap = { great: '😊', normal: '😐', struggled: '😫' };
                      const moodData = item.moodLogs?.[selectedGraphDate];
                      const moodEmoji = moodData?.mood ? moodMap[moodData.mood] : null;

                      return (
                        <TouchableOpacity 
                          key={item.id} 
                          style={[styles.listItem, { borderColor: item.color || theme.border }]}
                          onPress={() => onToggle(item.id, item.type, selectedGraphDate)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.itemEmoji}>{item.emoji}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.itemName, styles.itemCompleted]}>{item.name}</Text>
                            {!!moodData?.note && (
                              <Text style={{ fontSize: 12, color: theme.textMuted, fontStyle: 'italic', marginTop: 2 }}>
                                {`"${moodData.note}"`}
                              </Text>
                            )}
                          </View>
                          {!!moodEmoji && <Text style={{ fontSize: 18, marginRight: 8 }}>{moodEmoji}</Text>}
                          <Feather name="check" size={20} color={theme.success} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Yapılmayanlar */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.dot, { backgroundColor: theme.danger }]} />
                  <Text style={styles.sectionTitle}>Yapılmayanlar ({missed.length})</Text>
                </View>
                
                {missed.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Harika! Bu gün için tüm görevler tamamlanmış. 🎉</Text>
                  </View>
                ) : (
                  <View style={styles.listContainer}>
                    {missed.map(item => (
                      <TouchableOpacity 
                        key={item.id} 
                        style={styles.listItem}
                        onPress={() => onToggle(item.id, item.type, selectedGraphDate)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.itemEmoji}>{item.emoji}</Text>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <View style={styles.checkboxEmpty} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
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
    maxHeight: '90%',
    flexDirection: 'column',
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
    paddingTop: 24,
    paddingBottom: 20,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    flex: 1,
  },
  graphContainer: {
    padding: 24,
    backgroundColor: theme.card, // var(--bg-card)
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  graphTitle: {
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xAxisContainer: {
    position: 'relative',
    height: 24,
    marginTop: 8,
    width: '100%',
  },
  xAxisLabelContainer: {
    position: 'absolute',
    transform: [{ translateX: -15 }], // approximate centering
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xAxisLabelContainerSelected: {
    backgroundColor: theme.background, // var(--bg-elevated)
  },
  xAxisLabel: {
    fontSize: 12,
    color: theme.textTertiary, // var(--text-tertiary)
    fontWeight: '600',
  },
  xAxisLabelSelected: {
    color: theme.accent, // var(--accent-primary)
    fontWeight: '800',
  },
  detailsContainer: {
    padding: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 24,
    color: theme.textMain,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textMuted,
  },
  emptyState: {
    padding: 16,
    backgroundColor: theme.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyStateText: {
    color: theme.textTertiary,
    fontSize: 13,
    textAlign: 'center',
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.card,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: theme.border,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  itemEmoji: {
    fontSize: 18,
  },
  itemName: {
    flex: 1,
    fontWeight: '600',
    color: theme.textMain,
  },
  itemCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  checkboxEmpty: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.border,
  }
});
