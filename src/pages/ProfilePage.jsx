import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ScrollView, TouchableOpacity, TextInput, DeviceEventEmitter, View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { useTheme, THEMES } from '../contexts/ThemeContext';
import { getLocalDateStr } from '../utils/habitUtils';
import ResetProgressModal from '../components/modals/ResetProgressModal';

export default function ProfilePage({ user, onLogout, isActive }) {
  const { t, language } = useLanguage();
  const { theme, currentThemeId, setTheme } = useTheme();
  const styles = getStyles(theme);
  const insets = useSafeAreaInsets();

  const [economy, setEconomy, isLoadingEconomy, reloadEconomy] = useAsyncStorage(`habit-tracker-economy-${user?.username}`, { spentCoins: 0, freezes: 0, frozenDates: [], focusMinutes: 0, xp: 0 });
  const safeEconomy = economy || { spentCoins: 0, freezes: 0, frozenDates: [], focusMinutes: 0, xp: 0 };



  useEffect(() => {
    if (isActive && reloadEconomy) {
      reloadEconomy();
    }
  }, [isActive, reloadEconomy]);
  
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

  const [users, setUsers] = useAsyncStorage('habit-tracker-users', []);
  const [isEditing, setIsEditing] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const { changeLanguage } = useLanguage();

  const [habits, setHabits, , reloadHabits] = useAsyncStorage(`habit-tracker-habits-${user?.username}`, []);
  const [tasks, setTasks, , reloadTasks] = useAsyncStorage(`habit-tracker-tasks-${user?.username}`, []);

  // Reset Progress Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleResetProgress = (selectedIds, fullReset = false) => {
    const todayStr = getLocalDateStr(new Date());
    const resetTimestamp = Date.now();

    if (fullReset) {
      // FULL ACCOUNT RESET: delete all habits and tasks entirely
      setHabits([]);
      setTasks([]);
    } else {
      // PARTIAL RESET: only clear progress of selected items
      const updatedHabits = (habits || []).map(h =>
        selectedIds.has(h.id) ? { ...h, completedDates: [], initialStreak: 0, postponedDates: [], moodLogs: {}, createdAtDate: todayStr } : h
      );
      const updatedTasks = (tasks || []).map(t =>
        selectedIds.has(t.id) ? { ...t, completedDates: [], initialStreak: 0, postponedDates: [], moodLogs: {}, createdAtDate: todayStr } : t
      );
      setHabits(updatedHabits);
      setTasks(updatedTasks);
    }

    // Reset economy: XP, tokens (spentCoins), freezes, focusMinutes, frozenDates
    setEconomy({ spentCoins: 0, freezes: 0, frozenDates: [], focusMinutes: 0, xp: 0 });

    // Reset user joinDate to today (resets "days active" counter)
    const safeUsers = users || [];
    const updatedUsers = safeUsers.map(u =>
      u.username === user?.username ? { ...u, joinDate: resetTimestamp } : u
    );
    setUsers(updatedUsers);
  };

  useEffect(() => {
    if (isActive) {
      reloadHabits();
      reloadTasks();
    }
  }, [isActive, reloadHabits, reloadTasks]);

  const [now] = useState(() => Date.now());

  // Calculate days active
  const daysActive = useMemo(() => {
    return user?.joinDate 
      ? Math.max(1, Math.floor((now - user.joinDate) / (1000 * 60 * 60 * 24)))
      : 1;
  }, [user?.joinDate, now]);

  const safeHabits = habits || [];
  const safeTasks = tasks || [];

  // Calculate Summary Stats
  const totalHabits = safeHabits.length;
  const totalTasks = safeTasks.length;
  const totalCompletedHabits = safeHabits.reduce((acc, habit) => acc + (habit.completedDates ? habit.completedDates.length : 0), 0);
  const totalCompletedTasks = safeTasks.reduce((acc, task) => acc + (task.completedDates ? task.completedDates.length : 0), 0);
  const totalCompleted = totalCompletedHabits + totalCompletedTasks;

  const handleUpdate = () => {
    if (!newEmail && !newPassword) return;

    // Update the fake DB
    const safeUsers = users || [];
    const updatedUsers = safeUsers.map(u => {
      if (u.username === user.username) {
        return {
          ...u,
          email: newEmail || u.email,
          password: newPassword || u.password
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    setNewEmail('');
    setNewPassword('');
    setIsEditing(false);
    setMessage('Bilgileriniz başarıyla güncellendi.');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView 
        contentContainerStyle={[styles.contentContainer, { paddingTop: Math.max(insets.top, 20) + 40 }]} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>{t('profile.title')}</Text>
        <Text style={styles.pageSubtitle}>{t('profile.subtitle')}</Text>
      </View>


      <Text style={styles.sectionTitle}>{t('profile.summary_title')}</Text>
      <View style={styles.dashboardGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>{t('profile.app_usage')}</Text>
          <Text style={[styles.statValue, { color: '#0ea5e9' }]}>{daysActive} {t('stats.days')}</Text>
          <Text style={styles.statSub}>{t('profile.since_registration')}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>{t('profile.total_completed')}</Text>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{totalCompleted}</Text>
          <Text style={styles.statSub}>{t('profile.tasks_and_habits')}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>{t('profile.active_habits')}</Text>
          <Text style={[styles.statValue, { color: '#f43f5e' }]}>{totalHabits}</Text>
          <Text style={styles.statSub}>{t('profile.tracked')}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>{t('profile.total_tasks')}</Text>
          <Text style={[styles.statValue, { color: '#f97316' }]}>{totalTasks}</Text>
          <Text style={styles.statSub}>{t('profile.added_instant_tasks')}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
      <View style={styles.authBox}>
        <Text style={styles.accountText}>
          {t('profile.username_label')}<Text style={styles.accountTextBold}>{user?.username}</Text>
        </Text>
        <Text style={styles.accountText}>
          {t('profile.email_label')}<Text style={styles.accountTextBold}>{user?.email}</Text>
        </Text>

        {!!message && <Text style={styles.successMessage}>{message}</Text>}

        {!isEditing ? (
          <TouchableOpacity activeOpacity={0.7} style={styles.btnPrimary} onPress={() => setIsEditing(true)}>
            <Text style={styles.btnPrimaryText}>{t('profile.change_info')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editForm}>
            <TextInput
              style={styles.inputField}
              placeholder={t('profile.new_email')}
              placeholderTextColor={theme.textMuted}
              value={newEmail}
              onChangeText={setNewEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.inputField}
              placeholder={t('profile.new_password')}
              placeholderTextColor={theme.textMuted}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <View style={styles.formActions}>
              <TouchableOpacity activeOpacity={0.7} style={[styles.btnPrimary, styles.btnCancel]} onPress={() => setIsEditing(false)}>
                <Text style={styles.btnCancelText}>{t('profile.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={[styles.btnPrimary, { flex: 1 }]} onPress={handleUpdate}>
                <Text style={styles.btnPrimaryText}>{t('profile.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
      <View style={styles.settingsBox}>
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>{t('profile.language')}</Text>
          <View style={styles.langToggle}>
            <TouchableOpacity 
              style={[styles.langBtn, language === 'tr' && styles.langBtnActive]}
              onPress={() => changeLanguage('tr')}
            >
              <Text style={[styles.langBtnText, language === 'tr' && styles.langBtnTextActive]}>TR</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
              onPress={() => changeLanguage('en')}
            >
              <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>EN</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.settingRow, { marginTop: 16, flexDirection: 'column', alignItems: 'stretch' }]}>
          <Text style={[styles.settingText, { marginBottom: 12 }]}>{t('profile.select_theme')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themesScroll} contentContainerStyle={{ paddingRight: 12 }}>
            {Object.keys(THEMES).map((themeId) => {
              const themeItem = THEMES[themeId];
              if (!themeItem) return null;
              const isActive = currentThemeId === themeId;
              return (
                <TouchableOpacity
                  key={themeId}
                  activeOpacity={0.7}
                  style={[
                    styles.themeChip,
                    isActive && { borderColor: themeItem.accent, backgroundColor: themeItem.accent + '15' }
                  ]}
                  onPress={() => setTheme(themeId)}
                >
                  <View style={styles.previewCirclesMini}>
                    {themeItem.previewColors.map((color, idx) => (
                      <View 
                        key={idx} 
                        style={[
                          styles.previewCircleMini, 
                          { backgroundColor: color, zIndex: 3 - idx, marginLeft: idx > 0 ? -6 : 0 }
                        ]} 
                      />
                    ))}
                  </View>
                  <Text style={[styles.themeChipText, isActive && { color: theme.textMain, fontWeight: '800' }]}>
                    {t(themeItem.nameKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Reset Progress Section */}
      <Text style={styles.sectionTitle}>{t('reset.section_title')}</Text>
      <View style={styles.resetBox}>
        <View style={styles.resetInfo}>
          <View style={styles.resetIconContainer}>
            <Feather name="refresh-cw" size={20} color="#f97316" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.resetTitle}>{t('reset.card_title')}</Text>
            <Text style={styles.resetDesc}>{t('reset.card_desc')}</Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.resetButton}
          onPress={() => setIsResetModalOpen(true)}
        >
          <Feather name="refresh-cw" size={16} color="#f97316" />
          <Text style={styles.resetButtonText}>{t('reset.button')}</Text>
        </TouchableOpacity>
      </View>

      <ResetProgressModal
        visible={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        habits={habits}
        tasks={tasks}
        onReset={handleResetProgress}
      />

      <Text style={styles.sectionTitle}>{t('profile.about')}</Text>
      <Text style={styles.aboutText}>{t('profile.about_text')}</Text>

      {user?.username === 'murat' && (
        <View style={styles.adminPanel}>
          <Text style={[styles.sectionTitle, { color: '#f43f5e' }]}>👑 {t('admin.title')}</Text>
          <View style={styles.adminBox}>
            <Text style={styles.adminDesc}>{t('admin.all_users')}</Text>
            
            <View style={styles.adminList}>
              {(users || []).map(u => (
                <View key={u.username} style={styles.adminUserCard}>
                  <Text style={styles.adminUsername}>@{u.username} {u.isAdmin && '👑'}</Text>
                  <Text style={styles.adminEmail}>{t('admin.email')} {u.email}</Text>
                  <Text style={styles.adminPass}>
                    {t('admin.password')} {u.password}  |  {t('admin.join_date')} {new Date(u.joinDate).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity activeOpacity={0.7} style={styles.btnLogout} onPress={onLogout}>
        <Text style={styles.btnLogoutText}>{t('profile.logout')}</Text>
      </TouchableOpacity>

      {/* Spacer for bottom nav */}
      <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textMain,
    marginBottom: 16,
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.card,
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
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
    marginBottom: 4,
  },
  statSub: {
    fontSize: 11,
    color: theme.textTertiary,
  },
  authBox: {
    marginBottom: 32,
    backgroundColor: theme.card,
    padding: 24,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: theme.border,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  accountText: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 12,
  },
  accountTextBold: {
    color: theme.textMain,
    fontWeight: '600',
    marginLeft: 8,
  },
  successMessage: {
    color: theme.success,
    fontSize: 13,
    marginBottom: 16,
  },
  btnPrimary: {
    backgroundColor: theme.accent,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  settingsBox: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 0.5,
    borderColor: theme.border,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingText: {
    color: theme.textMain,
    fontSize: 16,
    fontWeight: '500',
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  langBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  langBtnActive: {
    backgroundColor: theme.accent,
  },
  langBtnText: {
    color: theme.textTertiary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  langBtnTextActive: {
    color: '#fff',
  },
  editForm: {
    gap: 12,
  },
  inputField: {
    backgroundColor: theme.background,
    borderWidth: 0.5,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 16,
    color: theme.textMain,
    fontSize: 15,
    marginBottom: 12,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.textTertiary,
  },
  btnCancelText: {
    color: theme.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  aboutText: {
    color: theme.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 40,
  },
  adminPanel: {
    marginBottom: 40,
  },
  adminBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderRadius: 16,
    padding: 20,
  },
  adminDesc: {
    color: theme.textMuted,
    fontSize: 13,
    marginBottom: 16,
  },
  adminList: {
    gap: 12,
  },
  adminUserCard: {
    backgroundColor: theme.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  adminUsername: {
    color: theme.textMain,
    fontWeight: '600',
    fontSize: 14,
  },
  adminEmail: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  adminPass: {
    color: theme.textTertiary,
    fontSize: 11,
    marginTop: 4,
  },
  btnLogout: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.danger,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  btnLogoutText: {
    color: theme.danger,
    fontSize: 15,
    fontWeight: '600',
  },
  resetBox: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    borderWidth: 0.5,
    borderColor: theme.border,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  resetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 14,
  },
  resetIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textMain,
    marginBottom: 3,
  },
  resetDesc: {
    fontSize: 12,
    color: theme.textMuted,
    lineHeight: 17,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    backgroundColor: 'rgba(249, 115, 22, 0.05)',
  },
  resetButtonText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '700',
  },
  themesScroll: {
    marginHorizontal: -4,
    paddingBottom: 4,
    marginTop: 4,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
  },
  previewCirclesMini: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  previewCircleMini: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.2,
    borderColor: '#ffffff',
  },
  themeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textMuted,
  },
  levelCard: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 0.5,
    borderColor: theme.border,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadgeBig: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  levelBadgeTextBig: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '950',
    lineHeight: 20,
  },
  levelBadgeSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 8,
    fontWeight: '900',
    marginTop: -2,
  },
  levelInfoText: {
    flex: 1,
  },
  levelRank: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.textMain,
    marginBottom: 4,
  },
  levelXpText: {
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.accent,
    borderRadius: 4,
  },
  nextLevelHint: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '600',
    alignSelf: 'flex-end',
  },
});
