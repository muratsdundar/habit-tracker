import os

def update_file(path, old_str, new_str):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if old_str in content:
        content = content.replace(old_str, new_str)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {path}")
    else:
        print(f"NOT FOUND in {path}:\n{old_str[:100]}")

# ----------------- ProfilePage.jsx -----------------
path_profile = "src/pages/ProfilePage.jsx"
update_file(path_profile, "import { getLevelInfo } from '../utils/levelUtils';\n", "")

level_info_code = """  const levelInfo = useMemo(() => {
    return getLevelInfo(safeEconomy.xp || 0);
  }, [safeEconomy.xp]);"""
update_file(path_profile, level_info_code, "")

level_badge = """          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Lv. {levelInfo.level}</Text>
          </View>"""
update_file(path_profile, level_badge, "")

level_card = """          <View style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <Text style={styles.levelTitle}>{t('level.title')}</Text>
              <Text style={styles.levelText}>Lv. {levelInfo.level}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${levelInfo.percent}%` }]} />
            </View>
            <View style={styles.levelStats}>
              <Text style={styles.xpText}>
                {safeEconomy.xp} XP / {levelInfo.maxXp === 999999 ? '∞' : levelInfo.maxXp + ' XP'}
              </Text>
              {levelInfo.neededXpForNext > 0 && (
                <Text style={styles.nextLevelText}>
                  {t('level.next_level_xp').replace('{xp}', levelInfo.neededXpForNext)}
                </Text>
              )}
            </View>
          </View>"""
update_file(path_profile, level_card, "")


# ----------------- ZenStatsModal.jsx -----------------
path_zenstats = "src/components/modals/ZenStatsModal.jsx"

update_file(path_zenstats,
"export default function ZenStatsModal({ isOpen, onClose, maxStreak, totalCompleted, bestHabitName, xp = 0, levelInfo, onOpenJourney, onOpenZenWrap }) {",
"export default function ZenStatsModal({ isOpen, onClose, maxStreak, totalCompleted, bestHabitName, onOpenJourney }) {")

xp_card = """            {/* XP & Level Card */}
            {levelInfo && (
              <View style={styles.xpCard}>
                <View style={styles.xpHeader}>
                  <View style={styles.xpLeft}>
                    <Feather name="zap" size={18} color={theme.accent} />
                    <Text style={styles.xpTitle}>{t('level.title')}</Text>
                  </View>
                  <View style={styles.levelBadgeSmall}>
                    <Text style={styles.levelBadgeText}>Lv. {levelInfo.level}</Text>
                  </View>
                </View>
                <Text style={styles.levelTitleText}>{t(levelInfo.titleKey)}</Text>
                <View style={styles.xpBarTrack}>
                  <View style={[styles.xpBarFill, { width: `${levelInfo.percent}%` }]} />
                </View>
                <Text style={styles.xpDetail}>
                  {levelInfo.currentProgressXp} / {levelInfo.maxXp - levelInfo.minXp} XP
                  {levelInfo.neededXpForNext > 0 ? `  •  Sonraki seviye için ${levelInfo.neededXpForNext} XP` : '  •  Maksimum Seviye!'}
                </Text>
              </View>
            )}"""
update_file(path_zenstats, xp_card, "")

zen_wrap_btn = """            {onOpenZenWrap && (
              <TouchableOpacity 
                activeOpacity={0.7}
                style={styles.zenWrapBtn}
                onPress={() => {
                  onClose();
                  onOpenZenWrap();
                }}
              >
                <Feather name="gift" size={18} color="#fff" />
                <Text style={styles.zenWrapBtnText}>Zen Wrap Raporu</Text>
              </TouchableOpacity>
            )}"""
update_file(path_zenstats, zen_wrap_btn, "")


# ----------------- ZenJourneyModal.jsx -----------------
path_journey = "src/components/modals/ZenJourneyModal.jsx"

update_file(path_journey,
"export default function ZenJourneyModal({ isOpen, onClose, maxStreak, xp = 0, levelInfo }) {",
"export default function ZenJourneyModal({ isOpen, onClose, maxStreak }) {")

xp_info = """          {/* XP Kaynak Bilgi Kartı */}
          <View style={styles.xpInfoCard}>
            <Text style={styles.xpInfoTitle}>⚡ {t('zen.xp_source')}</Text>
            <Text style={styles.xpInfoItem}>• {t('zen.xp_task')}</Text>
            <Text style={styles.xpInfoItem}>• {t('zen.xp_habit')}</Text>
            <Text style={styles.xpInfoItem}>• {t('zen.xp_focus')}</Text>
            <Text style={styles.xpInfoItem}>• {t('zen.xp_streak')}</Text>
          </View>"""
update_file(path_journey, xp_info, "")


# ----------------- HomePage.jsx -----------------
path_home = "src/pages/HomePage.jsx"

update_file(path_home, "import ZenGardenSandboxModal from '../components/modals/ZenGardenSandboxModal';\n", "")
update_file(path_home, "import ZenWrapModal from '../components/modals/ZenWrapModal';\n", "")
update_file(path_home, "import { getLevelInfo } from '../utils/levelUtils';\n", "")

state_vars = """  // Zen Stats Modal
  const [isZenStatsOpen, setIsZenStatsOpen] = useState(false);
  const [isZenJourneyOpen, setIsZenJourneyOpen] = useState(false);
  const [isZenWrapOpen, setIsZenWrapOpen] = useState(false);
  const [isSkillTreeOpen, setIsSkillTreeOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);"""
update_file(path_home, state_vars, """  // Zen Stats Modal
  const [isZenStatsOpen, setIsZenStatsOpen] = useState(false);
  const [isZenJourneyOpen, setIsZenJourneyOpen] = useState(false);
  const [isSkillTreeOpen, setIsSkillTreeOpen] = useState(false);""")

home_level_info = """  const levelInfo = useMemo(() => {
    return getLevelInfo(safeEconomy.xp || 0);
  }, [safeEconomy.xp]);"""
update_file(path_home, home_level_info, "")

handle_toggle_old = """  const handleToggle = useCallback((id, type, targetDate = activeDate, skipMoodModal = false) => {
    let xpChange = 0;
    let newlyCompletedItem = null;

    if (type === 'task') {
      setTasks(prevTasks => prevTasks.map(t => {
        if (t.id === id) {
          const dates = t.completedDates || [];
          const isCompletedActive = dates.includes(targetDate);
          const newDates = isCompletedActive ? dates.filter((d) => d !== targetDate) : [...dates, targetDate];
          xpChange = isCompletedActive ? -10 : 10;
          if (!isCompletedActive) newlyCompletedItem = { ...t, type: 'task' };
          return { ...t, completedDates: newDates };
        }
        return t;
      }));
    } else {
      setHabits(prevHabits => prevHabits.map(h => {
        if (h.id === id) {
          const dates = h.completedDates || [];
          const isCompletedActive = dates.includes(targetDate);
          const newDates = isCompletedActive ? dates.filter((d) => d !== targetDate) : [...dates, targetDate];
          xpChange = isCompletedActive ? -15 : 15;
          if (!isCompletedActive) newlyCompletedItem = { ...h, type: 'habit' };
          return { ...h, completedDates: newDates };
        }
        return h;
      }));
    }

    if (xpChange !== 0) {
      if (xpChange > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Trigger mood reflection modal for newly completed habit/task unless blocked
        if (newlyCompletedItem && !skipMoodModal) {
          setMoodModalItem(newlyCompletedItem);
          setMoodModalDate(targetDate);
        }
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setEconomy(prev => ({
        ...prev,
        xp: Math.max(0, (prev.xp || 0) + xpChange)
      }));
    }
  }, [activeDate, setTasks, setHabits, setEconomy]);"""

handle_toggle_new = """  const handleToggle = useCallback((id, type, targetDate = activeDate, skipMoodModal = false) => {
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
  }, [activeDate, setTasks, setHabits]);"""
update_file(path_home, handle_toggle_old, handle_toggle_new)

callbacks_old = """  const openShop = useCallback(() => setIsShopOpen(true), []);
  const openZenStats = useCallback(() => setIsZenStatsOpen(true), []);
  const openSandbox = useCallback(() => setIsSandboxOpen(true), []);
  const openGraph = useCallback(() => setIsGraphModalOpen(true), []);"""
callbacks_new = """  const openShop = useCallback(() => setIsShopOpen(true), []);
  const openZenStats = useCallback(() => setIsZenStatsOpen(true), []);
  const openGraph = useCallback(() => setIsGraphModalOpen(true), []);"""
update_file(path_home, callbacks_old, callbacks_new)

zengarden_old = """      <ZenGarden 
        maxStreak={maxStreak} 
        level={levelInfo.level}
        gardenLayout={safeEconomy.gardenLayout || []}
        onPress={openZenStats} 
        onOpenSandbox={openSandbox}
      />"""
zengarden_new = """      <ZenGarden 
        maxStreak={maxStreak} 
        onPress={openZenStats} 
      />"""
update_file(path_home, zengarden_old, zengarden_new)

deps_old = """    time, activeDate, todayStr, currentCoins,
    openTimeline, openFocusToDo, openShop,
    maxStreak, levelInfo.level, safeEconomy.gardenLayout,
    openZenStats, openSandbox,
    dailyData, maxCount, avgCompleted, setActiveDate, openGraph,"""
deps_new = """    time, activeDate, todayStr, currentCoins,
    openTimeline, openFocusToDo, openShop,
    maxStreak,
    openZenStats,
    dailyData, maxCount, avgCompleted, setActiveDate, openGraph,"""
update_file(path_home, deps_old, deps_new)

zenstats_old = """      <ZenStatsModal 
        isOpen={isZenStatsOpen}
        onClose={() => setIsZenStatsOpen(false)}
        maxStreak={maxStreak}
        totalCompleted={totalCompletedAllTime}
        bestHabitName={bestHabitName}
        xp={safeEconomy.xp || 0}
        levelInfo={levelInfo}
        onOpenJourney={() => setIsSkillTreeOpen(true)}
        onOpenZenWrap={() => setIsZenWrapOpen(true)}
      />"""
zenstats_new = """      <ZenStatsModal 
        isOpen={isZenStatsOpen}
        onClose={() => setIsZenStatsOpen(false)}
        maxStreak={maxStreak}
        totalCompleted={totalCompletedAllTime}
        bestHabitName={bestHabitName}
        onOpenJourney={() => setIsSkillTreeOpen(true)}
      />"""
update_file(path_home, zenstats_old, zenstats_new)

zenwrap_old = """      <ZenWrapModal
        isOpen={isZenWrapOpen}
        onClose={() => setIsZenWrapOpen(false)}
        maxStreak={maxStreak}
        totalCompleted={totalCompletedAllTime}
        bestHabitName={bestHabitName}
        focusMinutes={safeEconomy.focusMinutes || 0}
        stage={activeStage}
      />"""
update_file(path_home, zenwrap_old, "")

zenjourney_old = """      <ZenJourneyModal 
        isOpen={isZenJourneyOpen}
        onClose={() => setIsZenJourneyOpen(false)}
        maxStreak={maxStreak}
        xp={safeEconomy.xp || 0}
        levelInfo={levelInfo}
      />"""
zenjourney_new = """      <ZenJourneyModal 
        isOpen={isZenJourneyOpen}
        onClose={() => setIsZenJourneyOpen(false)}
        maxStreak={maxStreak}
      />"""
update_file(path_home, zenjourney_old, zenjourney_new)

zensandbox_old = """      <ZenGardenSandboxModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        economy={safeEconomy}
        setEconomy={setEconomy}
      />"""
update_file(path_home, zensandbox_old, "")

print("Script completed")
