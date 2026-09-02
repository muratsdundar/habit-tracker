import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, DeviceEventEmitter } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { calculateStreak, getLast7Days, isItemDay, isItemAvailable } from '../utils/habitUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import Svg, { Circle } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import StatsTable from '../components/StatsTable';
import FullStatsModal from '../components/modals/FullStatsModal';
import MiniChart from '../components/MiniChart';
import GraphModal from '../components/modals/GraphModal';

const CircularProgress = ({ progress, total, max, color, title, subtitle }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={styles.circularProgressContainer}>
      <Text style={styles.circularProgressTitle}>{title}</Text>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            stroke={theme.border}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            stroke={color}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.circularProgressTextContainer}>
          <Text style={styles.circularProgressPercent}>{progress}%</Text>
          <Text style={styles.circularProgressSubtitle}>{total}/{max}</Text>
        </View>
      </View>
    </View>
  );
};

export default function HabitSumPage({ user, isActive }) {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const insets = useSafeAreaInsets();
  const [habits, , , reloadHabits] = useAsyncStorage(`habit-tracker-habits-${user?.username}`, []);
  const [tasks, , , reloadTasks] = useAsyncStorage(`habit-tracker-tasks-${user?.username}`, []);
  const [isFullStatsOpen, setIsFullStatsOpen] = React.useState(false);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [selectedGraphDate, setSelectedGraphDate] = useState(null);
  const [activeChartDate, setActiveChartDate] = useState(null);

  useEffect(() => {
    if (isActive) {
      reloadHabits();
      reloadTasks();
    }
  }, [isActive, reloadHabits, reloadTasks]);

  const lastOffsetY = useRef(0);
  const handleScroll = (event) => {
    const currentY = event.nativeEvent.contentOffset.y;
    if (currentY <= 0) {
      DeviceEventEmitter.emit('scroll-dir', 'up');
      lastOffsetY.current = currentY;
    } else if (currentY > lastOffsetY.current + 20) {
      DeviceEventEmitter.emit('scroll-dir', 'down');
      lastOffsetY.current = currentY;
    } else if (currentY < lastOffsetY.current - 20) {
      DeviceEventEmitter.emit('scroll-dir', 'up');
      lastOffsetY.current = currentY;
    }
  };
  
  const safeHabits = habits || [];
  const safeTasks = tasks || [];
  const allItems = [...safeHabits, ...safeTasks];
  const last7Days = getLast7Days(language === 'en' ? 'en-US' : 'tr-TR');

  // MiniChart data
  const memoizedChartData = useMemo(() => {
    const data = last7Days.map(day => {
      let completedCount = 0;
      allItems.forEach(item => {
        if (isItemDay(item, new Date(day.dateStr))) {
          if (item.completedDates && item.completedDates.includes(day.dateStr)) {
            completedCount++;
          }
        }
      });
      return { ...day, count: completedCount };
    });
    const max = Math.max(...data.map(d => d.count), 1);
    const sum = data.reduce((acc, curr) => acc + curr.count, 0);
    const avg = data.length > 0 ? (sum / data.length).toFixed(1) : 0;
    return { dailyData: data, maxCount: max, avgCompleted: avg };
  }, [allItems, language]);

  const { dailyData, maxCount, avgCompleted } = memoizedChartData;

  // Init activeChartDate to today
  useEffect(() => {
    if (activeChartDate === null && last7Days.length > 0) {
      setActiveChartDate(last7Days[last7Days.length - 1].dateStr);
    }
  }, [last7Days, activeChartDate]);

  // Aggregate stats
  const totalItems = allItems.length;
  const activeStreaks = allItems.filter(item => calculateStreak(item.completedDates, item.initialStreak, item.createdAtDate) > 0).length;
  
  // Calculate today's completion rate
  const todayStr = last7Days[6].dateStr;
  const todayItems = allItems.filter(item => isItemAvailable(item, new Date()));
  const todayTotalItems = todayItems.length;
  const completedToday = todayItems.filter(item => (item.completedDates || []).includes(todayStr)).length;
  const todayProgress = todayTotalItems > 0 ? Math.round((completedToday / todayTotalItems) * 100) : 0;

  // Calculate all-time completion rate
  // New robust algorithm:
  // - Use createdAtDate if it's a valid date not in the future
  // - Otherwise use the EARLIEST completedDate (from compDates), or today
  // - Cap the start to the earliest actual completion so we don't inflate expected with days before the habit really began
  let allTimeExpected = 0;
  let allTimeCompleted = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  allItems.forEach(item => {
    const compDates = item.completedDates || [];
    const completions = compDates.length;
    allTimeCompleted += completions;

    // Determine the real start date of this item
    // Priority: createdAtDate (if valid), else earliest completedDate, else today
    let startDateObj = new Date(today);

    if (item.createdAtDate) {
      const d = new Date(item.createdAtDate);
      d.setHours(0, 0, 0, 0);
      if (!isNaN(d.getTime()) && d <= today) {
        startDateObj = d;
      }
    }

    // Key fix: if there are completions, the true "active from" date is whichever
    // is LATER — the createdAtDate OR the earliest completion date.
    // This prevents old createdAtDate (surviving a data reset) from inflating expected.
    if (compDates.length > 0) {
      const sorted = [...compDates].sort();
      const earliestComp = new Date(sorted[0]);
      earliestComp.setHours(0, 0, 0, 0);
      if (earliestComp > startDateObj) {
        // All completions are after the declared start date → habit was effectively
        // "inactive" between startDate and first completion. Use firstCompletion as start.
        startDateObj = earliestComp;
      }
    } else {
      // No completions → habit starts today
      startDateObj = new Date(today);
    }

    // Count expected occurrences from startDateObj to today
    let expectedSinceCreation = 0;
    const checkDate = new Date(startDateObj);
    while (checkDate <= today) {
      if (isItemDay(item, checkDate)) {
        expectedSinceCreation++;
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }

    // The expected total is at least as many as actual completions (never below 100%)
    allTimeExpected += Math.max(expectedSinceCreation, completions);
  });

  const allTimeProgress = allTimeExpected > 0 ? Math.min(100, Math.round((allTimeCompleted / allTimeExpected) * 100)) : 0;

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingTop: Math.max(insets.top, 20) + 40 }]} 
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>{t('stats.title')}</Text>
        <Text style={styles.pageSubtitle}>{t('stats.subtitle')}</Text>
      </View>

      {totalItems === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>{t('stats.no_data_title')}</Text>
          <Text style={styles.emptyDesc}>{t('stats.no_data_desc')}</Text>
        </View>
      ) : (
        <View style={styles.dashboard}>
          
          <View style={styles.heroCard}>
            <View style={styles.heroCardInner}>
              <CircularProgress 
                title={t('stats.today_progress')}
                progress={todayProgress}
                total={completedToday}
                max={todayTotalItems}
                color={theme.success}
              />
              <CircularProgress 
                title={t('stats.all_time_progress')}
                progress={allTimeProgress}
                total={allTimeCompleted}
                max={allTimeExpected}
                color={theme.accent}
              />
            </View>
            <Text style={styles.heroMessage}>
              {todayProgress === 100 ? t('stats.msg.all_done') : 
               todayProgress >= 50 ? t('stats.msg.half_done') : 
               t('stats.msg.start')}
            </Text>
          </View>

          <View style={styles.dashboardGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statTitle}>{t('stats.total_target')}</Text>
              <Text style={styles.statValue}>{totalItems}</Text>
              <Text style={styles.statSub}>{t('stats.active_habits')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statTitle}>{t('stats.active_streaks')}</Text>
              <Text style={styles.statValue}>{activeStreaks}</Text>
              <Text style={styles.statSub}>{t('stats.ongoing_chain')}</Text>
            </View>
          </View>

          <StatsTable allItems={allItems} onExpand={() => setIsFullStatsOpen(true)} />

          <MiniChart
            dailyData={dailyData}
            maxCount={maxCount}
            avgCompleted={avgCompleted}
            activeDate={activeChartDate || last7Days[last7Days.length - 1]?.dateStr}
            setActiveDate={setActiveChartDate}
            onGraphPress={() => setIsGraphModalOpen(true)}
          />

          <Text style={styles.sectionTitle}>{t('stats.weekly_perf')}</Text>
          
          <View style={styles.itemList}>
            {allItems.map((item) => {
              const streak = calculateStreak(item.completedDates, item.initialStreak, item.createdAtDate);
              const expectedThisWeek = last7Days.filter(day => isItemAvailable(item, new Date(day.dateStr))).length;
              const completedThisWeek = last7Days.filter(day => isItemDay(item, new Date(day.dateStr)) && (item.completedDates || []).includes(day.dateStr)).length;
              const weekProgress = expectedThisWeek > 0 ? Math.round((completedThisWeek / expectedThisWeek) * 100) : 0;

              return (
                <View key={item.id} style={styles.habitStatCard}>
                  <View style={styles.statHeader}>
                    <Text style={styles.statName}>{item.name}</Text>
                    <View style={styles.streakBadge}>
                      <Text style={styles.streakBadgeText}>🔥 {streak} {t('stats.days')}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.progressWrap}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${weekProgress}%` }]} />
                    </View>
                    <Text style={styles.progressPct}>%{weekProgress}</Text>
                  </View>

                  <View style={styles.weekCircles}>
                    {last7Days.map((day) => {
                      const isDone = (item.completedDates || []).includes(day.dateStr);
                      return (
                        <View key={day.dateStr} style={styles.dayWrap}>
                          <View style={[styles.circle, isDone && styles.circleDone]}>
                            {isDone && <Feather name="check" size={14} color={theme.background} />}
                          </View>
                          <Text style={styles.dayLbl}>{day.dayName}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Spacer for bottom nav */}
      <View style={{ height: 100 }} />

      <FullStatsModal 
        isOpen={isFullStatsOpen}
        onClose={() => setIsFullStatsOpen(false)}
        allItems={allItems}
      />

      <GraphModal
        isOpen={isGraphModalOpen}
        onClose={() => setIsGraphModalOpen(false)}
        dailyData={dailyData}
        graphMaxCount={maxCount}
        selectedGraphDate={selectedGraphDate || last7Days[last7Days.length - 1]?.dateStr}
        setSelectedGraphDate={setSelectedGraphDate}
        allItems={allItems}
        todayStr={last7Days[last7Days.length - 1]?.dateStr}
        isItemDay={isItemDay}
        isItemAvailable={isItemAvailable}
        onToggle={() => {}}
      />
    </ScrollView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 120,
  },
  pageHeader: {
    marginBottom: 32,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.textMain,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    color: theme.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textMain,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
  },
  dashboard: {
    flex: 1,
  },
  heroCard: {
    backgroundColor: theme.card,
    borderRadius: 32, // squircle
    padding: 32,
    marginBottom: 24,
    borderWidth: 0.5,
    borderColor: theme.border,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  heroCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  circularProgressContainer: {
    alignItems: 'center',
  },
  circularProgressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted,
    marginBottom: 16,
  },
  circularProgressTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressPercent: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.textMain,
    lineHeight: 34,
  },
  circularProgressSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.textTertiary,
    marginTop: 2,
  },
  heroMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted,
    textAlign: 'center',
  },
  dashboardGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.card,
    padding: 20,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: theme.border,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.textMain,
    marginBottom: 4,
  },
  statSub: {
    fontSize: 11,
    color: theme.textTertiary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textMain,
    marginBottom: 16,
  },
  itemList: {
    gap: 16,
  },
  habitStatCard: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 0.5,
    borderColor: theme.border,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textMain,
  },
  streakBadge: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  streakBadgeText: {
    color: theme.danger,
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: theme.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.accent,
    borderRadius: 4,
  },
  progressPct: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.textMuted,
    width: 36,
  },
  weekCircles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayWrap: {
    alignItems: 'center',
    gap: 8,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 12, // slightly squircled
    backgroundColor: theme.background,
    borderWidth: 0.5,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleDone: {
    backgroundColor: theme.success,
    borderColor: theme.success,
  },
  dayLbl: {
    fontSize: 11,
    color: theme.textTertiary,
    fontWeight: '600',
  }
});
