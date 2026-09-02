import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Line } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { catmullRom2bezier } from '../utils/chartUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export default function MiniChart({ 
  dailyData, 
  maxCount, 
  avgCompleted, 
  activeDate, 
  setActiveDate, 
  onGraphPress 
}) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const SVG_WIDTH = 300;
  const SVG_HEIGHT = 80;
  const graphMaxCount = Math.max(maxCount, 2);

  const points = dailyData.map((d, i) => {
    const x = (i / (dailyData.length - 1 || 1)) * SVG_WIDTH;
    const y = SVG_HEIGHT - ((d.count / graphMaxCount) * (SVG_HEIGHT - 16));
    return { x, y };
  });

  const linePath = catmullRom2bezier(points);
  const areaPath = `${linePath} L ${SVG_WIDTH},${SVG_HEIGHT} L 0,${SVG_HEIGHT} Z`;

  return (
    <View style={styles.chartCard}>
      {/* Header: title + graph icon */}
      <TouchableOpacity 
        style={styles.chartHeader}
        onPress={onGraphPress}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View>
          <Text style={styles.chartTitle}>{t('home.habit_performance')}</Text>
          <Text style={styles.chartValue}>
            {avgCompleted} <Text style={styles.chartUnit}>{t('home.avg_per_day')}</Text>
          </Text>
        </View>
        <Feather name="bar-chart-2" size={20} color={theme.textMuted} />
      </TouchableOpacity>

      {/* SVG Graph — non-interactive, lives in its own layout box (no absoluteFill) */}
      <View style={styles.svgContainer} pointerEvents="none">
        <Svg width="100%" height={SVG_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
          <Defs>
            <LinearGradient id="miniChartGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.accent} stopOpacity="0.55" />
              <Stop offset="0.5" stopColor={theme.accent} stopOpacity="0.12" />
              <Stop offset="1" stopColor={theme.accent} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Line
            x1="0" y1={SVG_HEIGHT / 2}
            x2={SVG_WIDTH} y2={SVG_HEIGHT / 2}
            stroke={theme.border}
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <Path d={areaPath} fill="url(#miniChartGrad)" />
          <Path d={linePath} fill="none" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>

      {/* Divider separating graph from day buttons */}
      <View style={styles.divider} />

      {/* Day selector buttons — fully interactive, below SVG (no overlap) */}
      <View style={styles.chartXLabels}>
        {dailyData.map((d, i) => {
          const isActive = activeDate === d.dateStr;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => setActiveDate(d.dateStr)}
              activeOpacity={0.65}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              style={[
                styles.xLabelBtn,
                isActive && { backgroundColor: theme.accent }
              ]}
            >
              <Text style={[
                styles.xLabelText,
                isActive && styles.xLabelTextActive
              ]}>
                {d.dayName}
              </Text>
              <View style={[
                styles.activityDot,
                {
                  backgroundColor: d.count > 0
                    ? (isActive ? 'rgba(255,255,255,0.7)' : theme.accent)
                    : 'transparent',
                  opacity: d.count > 0
                    ? Math.min(0.4 + (d.count / graphMaxCount) * 0.6, 1)
                    : 0,
                }
              ]} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  chartCard: {
    backgroundColor: theme.card,
    borderRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  chartValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.textMain,
  },
  chartUnit: {
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: 'normal',
  },
  svgContainer: {
    width: '100%',
    height: 80,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginTop: 12,
    marginBottom: 10,
    opacity: 0.5,
  },
  chartXLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xLabelBtn: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 7,
    borderRadius: 12,
    minWidth: 36,
    gap: 4,
  },
  xLabelText: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '600',
  },
  xLabelTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  activityDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

