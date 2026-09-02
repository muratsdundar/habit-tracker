import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'; // migrationDoneRef & corruptionFixDoneRef guard one-time effects
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Modal, TextInput, DeviceEventEmitter, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Path, Line, Circle, Rect } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { getLocalDateStr, calculateStreak, getLast7Days, isItemDay, isItemAvailable } from '../utils/habitUtils';
import { scheduleItemNotifications, cancelNotifications } from '../utils/notificationUtils';
import AddModal from '../components/modals/AddModal';
import GraphModal from '../components/modals/GraphModal';
import HomeHeader from '../components/HomeHeader';
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal';
import MoodReflectionModal from '../components/modals/MoodReflectionModal';
import TimelineModal from '../components/modals/TimelineModal';
import HabitListItem from '../components/HabitListItem';
import DailyPlannerSection from '../components/DailyPlannerSection';
import ZenStatsModal from '../components/modals/ZenStatsModal';
import FocusModal from '../components/modals/FocusModal';
import ZenJourneyModal from '../components/modals/ZenJourneyModal';
import { STAGES } from '../constants/zenStages';

export default function HomePage({ user }) {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [tasks, setTasks] = useAsyncStorage(`habit-tracker-tasks-${user?.username}`, []);
  const [habits, setHabits] = useAsyncStorage(`habit-tracker-habits-${user?.username}`, []);
  const [economy, setEconomy] = useAsyncStorage(`habit-tracker-economy-${user?.username}`, { spentCoins: 0, freezes: 0, frozenDates: [], focusMinutes: 0, xp: 0 });
  const safeEconomy = economy || { spentCoins: 0, freezes: 0, frozenDates: [], focusMinutes: 0, xp: 0 };
  
  const todayStr = getLocalDateStr();
  const [activeDate, setActiveDate] = useState(todayStr);

  const lastOffsetY = useRef(0);
  const lastDir = useRef('up');
  
  const handleScroll = (event) => {
    const currentY = event.nativeEvent.contentOffset.y;
    let newDir = lastDir.current;

    if (currentY <= 0) {
      newDir = 'up';
      lastOffsetY.current = currentY;
    } else if (currentY > lastOffsetY.current + 20) {
      newDir = 'down';
      lastOffsetY.current = currentY;
    } else if (currentY < lastOffsetY.current - 20) {
      newDir = 'up';
      lastOffsetY.current = currentY;
    }

    if (newDir !== lastDir.current) {
      DeviceEventEmitter.emit('scroll-dir', newDir);
      lastDir.current = newDir;
    }
  };

  // Clock State
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeType, setActiveType] = useState('habit');
  const [itemToEdit, setItemToEdit] = useState(null);
  
  // Graph Modal State
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [selectedGraphDate, setSelectedGraphDate] = useState(todayStr);

  // Timeline State
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  // Zen Stats Modal
  const [isZenStatsOpen, setIsZenStatsOpen] = useState(false);
  const [isZenJourneyOpen, setIsZenJourneyOpen] = useState(false);



  // Focus Modal
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [activeFocusItem, setActiveFocusItem] = useState(null);
  
  // Mood Reflection Modal State
  const [moodModalItem, setMoodModalItem] = useState(null);
  const [moodModalDate, setMoodModalDate] = useState(null);

  // Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);


  const openAddModal = useCallback((type = 'habit', item = null) => {
    setActiveType(type);
    setItemToEdit(item);
    setIsAddModalOpen(true);
  }, []);

  // Global event listener for Add Modal from BottomNav
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('open-add-modal', () => openAddModal('habit'));
    return () => {
      subscription.remove();
    };
  }, [openAddModal]);

  const safeTasks = tasks || [];
  const safeHabits = habits || [];

  // One-time migration for legacy initialStreak
  // ─── BUG FIX: migrationDoneRef prevents re-execution on every render. ──────
  // safeHabits/safeTasks are new object references on every render, so listing
  // them as deps caused this effect to run perpetually — a silent render loop.
  // We run it exactly once after the initial data load instead.
  const migrationDoneRef = useRef(false);
  useEffect(() => {
    if (migrationDoneRef.current) return;
    // Wait until data has loaded from AsyncStorage before migrating
    if (habits === null || tasks === null) return;
    migrationDoneRef.current = true;

    const migrateList = (list) => {
      let changed = false;
      const newList = list.map(item => {
        if (item.initialStreak > 0) {
          changed = true;
          const backfillDates = [...(item.completedDates || [])];
          const refDate = item.createdAtDate ? new Date(item.createdAtDate) : new Date();
          for (let i = 1; i <= item.initialStreak; i++) {
            const d = new Date(refDate);
            d.setDate(refDate.getDate() - i);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dStr = `${year}-${month}-${day}`;
            if (!backfillDates.includes(dStr)) backfillDates.push(dStr);
          }
          return { ...item, completedDates: backfillDates, initialStreak: 0 };
        }
        return item;
      });
      return { changed, newList };
    };

    const currentHabits = habits || [];
    const currentTasks = tasks || [];

    if (currentHabits.length > 0) {
      const { changed, newList } = migrateList(currentHabits);
      if (changed) setHabits(newList);
    }
    if (currentTasks.length > 0) {
      const { changed, newList } = migrateList(currentTasks);
      if (changed) setTasks(newList);
    }
  }, [habits, tasks, setHabits, setTasks]);

  // One-time migration to computed economy
  useEffect(() => {
    if (economy && economy.coins !== undefined && economy.spentCoins === undefined) {
      const freezesBought = economy.freezes || 0;
      const consumedFreezes = (economy.frozenDates || []).length;
      const newSpent = (freezesBought + consumedFreezes) * 150;
      
      setEconomy({
        spentCoins: newSpent,
        freezes: freezesBought,
        frozenDates: economy.frozenDates || [],
        focusMinutes: 0
      });
    }
  }, [economy, setEconomy]);

  const allItems = [
    ...safeTasks.map(t => ({ ...t, type: 'task' })),
    ...safeHabits.map(h => ({ ...h, type: 'habit' }))
  ].sort((a, b) => b.id - a.id);

  const memoizedStats = useMemo(() => {
    let max = 0;
    let total = 0;
    let bestName = '';
    const allCompletedDates = new Set();

    allItems.forEach(item => {
      // Find the best individual habit (just for the stats text)
      const s = calculateStreak(item.completedDates, item.initialStreak, item.createdAtDate);
      if (s > max) {
        max = s;
        bestName = item.name;
      }
      // Combine all dates for global streak
      if (item.completedDates) {
        item.completedDates.forEach(date => allCompletedDates.add(date));
      }
      total += (item.completedDates || []).length;
    });

    // Global streak based on ANY activity on a day
    const globalStreak = calculateStreak(Array.from(allCompletedDates), 0, null, safeEconomy.frozenDates);

    return { maxStreak: globalStreak, totalCompletedAllTime: total, bestHabitName: bestName, allCompletedDatesArray: Array.from(allCompletedDates) };
  }, [allItems, safeEconomy.frozenDates]);

  const { maxStreak, totalCompletedAllTime, bestHabitName, allCompletedDatesArray } = memoizedStats;

  const activeStage = useMemo(() => {
    let stage = STAGES[0];
    for (let i = 0; i < STAGES.length; i++) {
      if (maxStreak <= STAGES[i].max) {
        stage = STAGES[i];
        break;
      }
    }
    return stage;
  }, [maxStreak]);





  // Auto-consume Streak Freeze logic
  useEffect(() => {
    if (safeEconomy.freezes <= 0) return;
    if (!allCompletedDatesArray || allCompletedDatesArray.length === 0) return;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);
    
    const allActive = new Set([...allCompletedDatesArray, ...(safeEconomy.frozenDates || [])]);
    
    // If we missed yesterday AND today, the streak broke yesterday.
    if (!allActive.has(yesterdayStr) && !allActive.has(todayStr)) {
      const sorted = Array.from(allActive).sort((a, b) => new Date(b) - new Date(a));
      const latest = sorted[0];
      
      if (latest < yesterdayStr) {
        setEconomy(prev => ({
          ...prev,
          freezes: prev.freezes - 1,
          frozenDates: [...(prev.frozenDates || []), yesterdayStr]
        }));
      }
    }
  }, [allCompletedDatesArray, safeEconomy.freezes, safeEconomy.frozenDates, setEconomy, todayStr]);

  const memoizedChartData = useMemo(() => {
    const last7Days = getLast7Days(language === 'en' ? 'en-US' : 'tr-TR');
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

  const handleToggle = useCallback((id, type, targetDate = activeDate, skipMoodModal = false) => {
    let newlyCompletedItem = null;
    let isCompletedActive = false;

    if (type === 'task') {
      setTasks(prevTasks => prevTasks.map(t => {
        if (t.id === id) {
          const dates = t.completedDates || [];
          isCompletedActive = dates.includes(targetDate);
          const newDates = isCompletedActive ? dates.filter((d) => d !== targetDate) : [...dates, targetDate];
          if (!isCompletedActive) newlyCompletedItem = { ...t, type: 'task' };
          return { ...t, completedDates: newDates };
        }
        return t;
      }));
    } else {
      setHabits(prevHabits => prevHabits.map(h => {
        if (h.id === id) {
          const dates = h.completedDates || [];
          isCompletedActive = dates.includes(targetDate);
          const newDates = isCompletedActive ? dates.filter((d) => d !== targetDate) : [...dates, targetDate];
          if (!isCompletedActive) newlyCompletedItem = { ...h, type: 'habit' };
          return { ...h, completedDates: newDates };
        }
        return h;
      }));
    }

    if (!isCompletedActive) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (newlyCompletedItem && !skipMoodModal) {
        setMoodModalItem(newlyCompletedItem);
        setMoodModalDate(targetDate);
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [activeDate, setTasks, setHabits]);

  const handleSaveMood = useCallback((id, type, targetDate, moodData) => {
    const updateFn = prevItems => prevItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          moodLogs: {
            ...(item.moodLogs || {}),
            [targetDate]: moodData
          }
        };
      }
      return item;
    });

    if (type === 'task') setTasks(updateFn);
    else setHabits(updateFn);
  }, [setTasks, setHabits]);



  const handleSaveItem = async (newItem, isEdit) => {
    // 1. Cancel previous notifications if editing
    if (isEdit && newItem.notificationIds) {
      await cancelNotifications(newItem.notificationIds);
    }
    
    // 2. Schedule new notifications if enabled
    let newNotificationIds = [];
    if (newItem.notificationsEnabled) {
      newNotificationIds = await scheduleItemNotifications(newItem);
    }
    
    // Update item with new notification IDs
    const finalItem = {
      ...newItem,
      notificationIds: newNotificationIds,
    };

    // 3. Save to storage / state
    if (isEdit) {
      if (finalItem.type === 'task') {
        setTasks(safeTasks.map(t => t.id === finalItem.id ? finalItem : t));
      } else {
        setHabits(safeHabits.map(h => h.id === finalItem.id ? finalItem : h));
      }
    } else {
      if (finalItem.type === 'task') {
        setTasks([finalItem, ...safeTasks]);
      } else {
        setHabits([finalItem, ...safeHabits]);
      }
    }
    setIsAddModalOpen(false);
  };

  const handleDeleteRequest = (item) => {
    setIsAddModalOpen(false);
    // Add timeout to prevent React Native Modal overlap freeze on iOS
    setTimeout(() => {
      setItemToDelete(item);
      setDeleteConfirmId(item ? item.id : null);
    }, 350);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    const targetItem = itemToDelete;

    // 1. Immediately reset modal state so UI never freezes
    setDeleteConfirmId(null);
    setItemToDelete(null);

    // 2. Remove item from both habits and tasks state
    setTasks(prev => (prev || []).filter(t => t.id !== targetItem.id));
    setHabits(prev => (prev || []).filter(h => h.id !== targetItem.id));

    // 3. Non-blocking cancellation of notifications
    if (targetItem.notificationIds && Array.isArray(targetItem.notificationIds)) {
      cancelNotifications(targetItem.notificationIds).catch(err => {
        console.warn('Failed to cancel notifications on delete:', err);
      });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
    setItemToDelete(null);
  };

  const handleOpenFocus = useCallback((item) => {
    setActiveFocusItem(item);
    setIsFocusModalOpen(true);
  }, []);

  const handleFocusComplete = useCallback((item, minutes) => {
    // Automatically toggle the habit/task as completed for today
    if (item && item.id && !item.id.startsWith('focus-to-do')) {
      handleToggle(item.id, item.type || 'habit', todayStr);
    }
    
    if (minutes) {
      // Sadece odak süresi kaydedilir; XP artık yalnızca görev/alışkanlık tamamlamadan gelir
      setEconomy(prev => ({
        ...prev,
        focusMinutes: (prev.focusMinutes || 0) + minutes,
      }));
    }
  }, [handleToggle, todayStr, setEconomy]);

  // Stable modal opener callbacks — defined once, not recreated on every render
  const openTimeline = useCallback(() => setIsTimelineOpen(true), []);
  const openFocusToDo = useCallback(() => {
    setActiveFocusItem({ id: 'focus-to-do-' + Date.now(), name: 'Focus to Do' });
    setIsFocusModalOpen(true);
  }, []);

  const openZenStats = useCallback(() => setIsZenStatsOpen(true), []);
  const openGraph = useCallback(() => setIsGraphModalOpen(true), []);

  // Memoized header — only re-renders when its actual data changes,
  // not on every unrelated state update (e.g. modal open/close).
  const renderHeader = useCallback(() => (
    <>
      <HomeHeader 
        time={time}
        activeDate={activeDate}
        todayStr={todayStr}
        onTimelinePress={openTimeline}
        onFocusPress={openFocusToDo}
        maxStreak={maxStreak}
        onZenPress={openZenStats}
      />

      <DailyPlannerSection
        allItems={allItems}
        isItemDay={isItemDay}
        handleToggle={(id, type) => handleToggle(id, type, activeDate, true)}
        openAddModal={openAddModal}
      />

      <Text style={styles.sectionTitle}>{t('home.all_tasks')}</Text>
    </>
  ), [
    time, activeDate, todayStr,
    openTimeline, openFocusToDo,
    maxStreak, openZenStats,
    allItems, isItemDay, handleToggle, openAddModal,
    styles, t
  ]);

  const renderItem = useCallback(({ item }) => {
    const isDone = (item.completedDates || []).includes(activeDate);
    const streak = calculateStreak(item.completedDates, item.initialStreak, item.createdAtDate, []);
    const typeLabel = item.type === 'habit' ? t('modal.habit') : t('modal.task');
    const isRelevantDay = isItemDay(item, new Date(activeDate));

    return (
      <HabitListItem 
        item={item}
        isDone={isDone}
        streak={streak}
        isRelevantDay={isRelevantDay}
        typeLabel={typeLabel}
        onToggle={handleToggle}
        onEdit={openAddModal}
        onFocus={handleOpenFocus}
      />
    );
  }, [activeDate, t, handleToggle, openAddModal, handleOpenFocus]);

  const sections = useMemo(() => {
    // 1. Filter out irrelevant items (not for today)
    // Also exclude items that have a targetTime (they appear in DailyPlannerSection)
    const relevantItems = allItems.filter(item => 
      isItemDay(item, new Date(activeDate)) && !item.targetTime
    );
    
    // 2. Group items by timeBlock
    const groups = {
      morning: [],
      afternoon: [],
      evening: [],
      anytime: []
    };
    
    // 3. Sort items inside groups based on completion status, but retain order otherwise
    const sortFn = (a, b) => {
      const aDone = (a.completedDates || []).includes(activeDate);
      const bDone = (b.completedDates || []).includes(activeDate);
      if (aDone === bDone) return 0;
      return aDone ? 1 : -1;
    };

    relevantItems.forEach(item => {
      const block = item.timeBlock || 'anytime';
      if (groups[block]) groups[block].push(item);
      else groups.anytime.push(item);
    });
    
    groups.morning.sort(sortFn);
    groups.afternoon.sort(sortFn);
    groups.evening.sort(sortFn);
    groups.anytime.sort(sortFn);
    
    // 4. Chunk groups into pairs for grid layout
    const chunkArray = (arr, size) => {
      const chunks = [];
      for(let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    };
    
    const result = [];
    if (groups.morning.length > 0) result.push({ title: '🌅 Sabah', data: chunkArray(groups.morning, 2) });
    if (groups.afternoon.length > 0) result.push({ title: '☀️ Öğle', data: chunkArray(groups.afternoon, 2) });
    if (groups.evening.length > 0) result.push({ title: '🌙 Akşam', data: chunkArray(groups.evening, 2) });
    if (groups.anytime.length > 0) result.push({ title: '⏳ Tüm Gün', data: chunkArray(groups.anytime, 2) });
    
    return result;
  }, [allItems, activeDate]);

  const uncompletedItems = useMemo(() => {
    return allItems.filter(item => {
      const isDone = (item.completedDates || []).includes(activeDate);
      const isRelevant = isItemDay(item, new Date(activeDate));
      return isRelevant && !isDone;
    });
  }, [allItems, activeDate]);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      try {
        const HabitWidget = require('../../widgets/HabitWidget').default;
        
        const pendingCount = allItems.filter(item => {
          const isDone = (item.completedDates || []).includes(activeDate);
          const isRelevant = isItemDay(item, new Date(activeDate));
          return isRelevant && !isDone;
        }).length;

        HabitWidget.updateSnapshot({ pendingCount });
      } catch (e) {
        console.log("Widget update failed", e);
      }
    }
  }, [allItems, activeDate]);

  return (
    <View style={styles.container}>
      <SectionList 
        sections={sections}
        keyExtractor={(item, index) => String(item[0]?.id) + index}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'space-between', marginBottom: 16 }}>
            {item.map(subItem => (
              <View style={{ flex: 1 }} key={subItem.id}>
                {renderItem({ item: subItem })}
              </View>
            ))}
            {item.length === 1 && <View style={{ flex: 1 }} />}
          </View>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeaderTitle}>{title}</Text>
        )}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyDesc}>{t('msg.no_items')}</Text>
          </View>
        }
        contentContainerStyle={[styles.contentContainer, { paddingTop: Math.max(insets.top, 20) + 40 }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={false}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      {/* Status bar fade overlay — Instagram-style gradient blur */}
      <View
        pointerEvents="none"
        style={[
          styles.statusBarFade,
          { height: Math.max(insets.top, 20) + 6 }
        ]}
      >
        <Svg
          height="100%"
          width="100%"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient id="statusFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.background} stopOpacity="1" />
              <Stop offset="0.6" stopColor={theme.background} stopOpacity="0.85" />
              <Stop offset="1" stopColor={theme.background} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#statusFade)" />
        </Svg>
      </View>

      <AddModal 
        visible={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        initialType={activeType}
        itemToEdit={itemToEdit}
        onSave={handleSaveItem}
        onDelete={handleDeleteRequest}
        existingItems={allItems}
      />
      
      <TimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        allItems={allItems}
        todayStr={todayStr}
        isItemDay={isItemDay}
        handleToggle={(id, type, date) => handleToggle(id, type, date || activeDate, true)}
        openAddModal={openAddModal}
      />

      <GraphModal
        isOpen={isGraphModalOpen}
        onClose={() => setIsGraphModalOpen(false)}
        dailyData={dailyData}
        graphMaxCount={maxCount}
        selectedGraphDate={selectedGraphDate}
        setSelectedGraphDate={setSelectedGraphDate}
        allItems={allItems}
        todayStr={todayStr}
        isItemDay={isItemDay}
        isItemAvailable={isItemAvailable}
        onToggle={(id, type, date) => handleToggle(id, type, date, true)}
      />

      <ZenStatsModal 
        isOpen={isZenStatsOpen}
        onClose={() => setIsZenStatsOpen(false)}
        maxStreak={maxStreak}
        totalCompleted={totalCompletedAllTime}
        bestHabitName={bestHabitName}
        onOpenJourney={() => setIsZenJourneyOpen(true)}
      />



      <ZenJourneyModal 
        isOpen={isZenJourneyOpen}
        onClose={() => setIsZenJourneyOpen(false)}
        maxStreak={maxStreak}
      />



      <FocusModal 
        isOpen={isFocusModalOpen}
        onClose={() => {
          setIsFocusModalOpen(false);
          setActiveFocusItem(null);
        }}
        habit={activeFocusItem}
        onComplete={handleFocusComplete}
        uncompletedItems={uncompletedItems}
      />

      <DeleteConfirmModal 
        isOpen={!!deleteConfirmId} 
        onConfirm={confirmDelete} 
        onCancel={cancelDelete} 
      />

      <MoodReflectionModal
        key={moodModalItem ? `${moodModalItem.id}-${moodModalDate}` : 'mood-modal'}
        isOpen={!!moodModalItem}
        onClose={() => setMoodModalItem(null)}
        item={moodModalItem}
        targetDate={moodModalDate}
        onSave={handleSaveMood}
      />




    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  // Instagram-style status bar fade overlay
  statusBarFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    pointerEvents: 'none',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 120,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  liveClock: {
    alignItems: 'flex-start',
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: theme.border,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textMain,
    marginRight: 6,
  },
  shopButtonIcon: {
    fontSize: 18,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  focusHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.accent,
    gap: 6,
  },
  focusHeaderButtonText: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontFamily: theme.fonts?.bold,
    fontSize: 22,
    color: theme.textMain,
    marginBottom: theme.spacing?.md || 16,
    marginTop: theme.spacing?.lg || 24,
  },
  sectionHeaderTitle: {
    fontFamily: theme.fonts?.bold,
    fontSize: 20,
    color: theme.textMain,
    marginBottom: 16,
    marginTop: 8,
  },
  emptyState: {
    padding: theme.spacing?.lg || 20,
    alignItems: 'center',
  },
  emptyDesc: {
    fontFamily: theme.fonts?.medium,
    color: theme.textMuted,
    fontSize: 14,
  }
});
