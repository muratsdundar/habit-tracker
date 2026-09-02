import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  FlatList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import AnimatedModalWrapper from './AnimatedModalWrapper';

// ─── Small sub-components for clarity ─────────────────────────────────────────

function CloseButton({ onPress, theme }) {
  return (
    <TouchableOpacity
      style={{
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: theme.background,
        borderWidth: 0.5, borderColor: theme.border,
        justifyContent: 'center', alignItems: 'center',
      }}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Feather name="x" size={16} color={theme.textMuted} />
    </TouchableOpacity>
  );
}

function BottomButtons({ leftLabel, leftIcon, leftDanger, rightLabel, rightIcon, onLeft, onRight, theme }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
      {/* Hesabı Sıfırla — left, outlined danger */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onLeft}
        style={{
          flex: 1, minHeight: 46, borderRadius: 14,
          flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
          borderWidth: 1.5,
          borderColor: leftDanger ? 'rgba(244,63,94,0.4)' : theme.border,
          backgroundColor: leftDanger ? 'rgba(244,63,94,0.06)' : theme.background,
          paddingHorizontal: 8,
        }}
      >
        {leftIcon && <Feather name={leftIcon} size={13} color={leftDanger ? '#f43f5e' : theme.textMain} style={{ marginRight: 5 }} />}
        <Text style={{ fontSize: 13, fontWeight: '700', color: leftDanger ? '#f43f5e' : theme.textMain }} numberOfLines={1}>
          {leftLabel}
        </Text>
      </TouchableOpacity>

      {/* Sıfırla — right, filled orange */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onRight}
        style={{
          flex: 1, minHeight: 46, borderRadius: 14,
          flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
          backgroundColor: '#f97316',
          paddingHorizontal: 8,
        }}
      >
        {rightIcon && <Feather name={rightIcon} size={13} color="#fff" style={{ marginRight: 5 }} />}
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }} numberOfLines={1}>
          {rightLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ResetProgressModal({ visible, onClose, habits, tasks, onReset }) {
  const { t } = useLanguage();
  const { theme } = useTheme();

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [screen, setScreen] = useState('main'); // 'main' | 'confirmReset' | 'confirmAccount'

  const allItems = useMemo(() => {
    const h = (habits || []).map(i => ({ ...i, _type: 'habit' }));
    const tk = (tasks || []).map(i => ({ ...i, _type: 'task' }));
    return [...h, ...tk];
  }, [habits, tasks]);

  const allSelected = allItems.length > 0 && selectedIds.size === allItems.length;

  const toggleItem = (id) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(allItems.map(i => i.id)));

  const handleClose = () => {
    setSelectedIds(new Set());
    setScreen('main');
    onClose();
  };

  const executeReset = () => {
    onReset(selectedIds);
    setSelectedIds(new Set());
    setScreen('main');
    onClose();
  };

  const executeAccountReset = () => {
    onReset(new Set(allItems.map(i => i.id)), true);
    setSelectedIds(new Set());
    setScreen('main');
    onClose();
  };

  // ── Shared card wrapper ────────────────────────────────────────────────────
  const Card = ({ children }) => (
    <View style={styles(theme).card}>
      {children}
    </View>
  );

  // ── Screen: Confirm Reset ──────────────────────────────────────────────────
  if (screen === 'confirmReset') {
    return (
      <AnimatedModalWrapper visible={visible} onClose={handleClose} align="center">
        <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
          <Card>
            <View style={styles(theme).confirmTopBar}>
              <CloseButton onPress={handleClose} theme={theme} />
            </View>
            <View style={styles(theme).confirmIconRow}>
              <View style={[styles(theme).iconCircle, { backgroundColor: 'rgba(249,115,22,0.12)' }]}>
                <Feather name="alert-triangle" size={22} color="#f97316" />
              </View>
            </View>
            <Text style={styles(theme).confirmTitle}>{t('reset.confirm_title')}</Text>
            <Text style={styles(theme).confirmSubtitle}>
              {t('reset.confirm_message').replace('{count}', String(selectedIds.size))}
            </Text>
            <BottomButtons
              leftLabel={t('modal.no')}
              leftIcon="arrow-left"
              onLeft={() => setScreen('main')}
              rightLabel={t('reset.confirm_button')}
              rightIcon="refresh-cw"
              onRight={executeReset}
              theme={theme}
            />
          </Card>
        </TouchableWithoutFeedback>
      </AnimatedModalWrapper>
    );
  }

  // ── Screen: Confirm Account Reset ─────────────────────────────────────────
  if (screen === 'confirmAccount') {
    return (
      <AnimatedModalWrapper visible={visible} onClose={handleClose} align="center">
        <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
          <Card>
            <View style={styles(theme).confirmTopBar}>
              <CloseButton onPress={handleClose} theme={theme} />
            </View>
            <View style={styles(theme).confirmIconRow}>
              <View style={[styles(theme).iconCircle, { backgroundColor: 'rgba(244,63,94,0.12)' }]}>
                <Feather name="alert-octagon" size={22} color="#f43f5e" />
              </View>
            </View>
            <Text style={[styles(theme).confirmTitle, { color: '#f43f5e' }]}>
              {t('reset.account_confirm_title')}
            </Text>
            <Text style={styles(theme).confirmSubtitle}>
              {t('reset.account_confirm_message')}
            </Text>
            {/* Warning banner */}
            <View style={styles(theme).warningBanner}>
              <Feather name="alert-triangle" size={13} color="#f43f5e" />
              <Text style={styles(theme).warningBannerText}>{t('reset.account_irreversible')}</Text>
            </View>
            <BottomButtons
              leftLabel={t('modal.no')}
              leftIcon="arrow-left"
              onLeft={() => setScreen('main')}
              rightLabel={t('reset.account_confirm_button')}
              rightIcon="trash-2"
              onRight={executeAccountReset}
              theme={theme}
            />
          </Card>
        </TouchableWithoutFeedback>
      </AnimatedModalWrapper>
    );
  }

  // ── Screen: Main ──────────────────────────────────────────────────────────
  return (
    <AnimatedModalWrapper visible={visible} onClose={handleClose} align="center">
      <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
        <Card>
          {/* Top bar */}
          <View style={styles(theme).topBar}>
            <Text style={styles(theme).topTitle}>{t('reset.title')}</Text>
            <CloseButton onPress={handleClose} theme={theme} />
          </View>
          <Text style={styles(theme).topSubtitle}>{t('reset.subtitle')}</Text>

          {/* Divider */}
          <View style={styles(theme).divider} />

          {/* Empty state — shown OUTSIDE of scroll, no clipping */}
          {allItems.length === 0 ? (
            <View style={styles(theme).emptyContainer}>
              <View style={styles(theme).emptyIconBox}>
                <Feather name="list" size={28} color={theme.textTertiary} />
              </View>
              <Text style={styles(theme).emptyTitle}>{t('home.all_tasks')}</Text>
              <Text style={styles(theme).emptyDesc}>{t('reset.no_data')}</Text>
            </View>
          ) : (
            <>
              {/* Select all */}
              <TouchableOpacity activeOpacity={0.7} style={styles(theme).selectAllRow} onPress={toggleAll}>
                <View style={[styles(theme).chk, allSelected && styles(theme).chkActive]}>
                  {allSelected && <Feather name="check" size={12} color="#fff" />}
                </View>
                <Text style={styles(theme).selectAllText}>
                  {allSelected ? t('reset.deselect_all') : t('reset.select_all')}
                </Text>
                <View style={styles(theme).badge}>
                  <Text style={styles(theme).badgeText}>{selectedIds.size}/{allItems.length}</Text>
                </View>
              </TouchableOpacity>

              {/* Item list — FlatList is better than ScrollView for dynamic lists */}
              <FlatList
                data={allItems}
                keyExtractor={item => String(item.id)}
                style={{ maxHeight: 300 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
                renderItem={({ item }) => {
                  const selected = selectedIds.has(item.id);
                  const count = item.completedDates?.length || 0;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[styles(theme).itemRow, selected && styles(theme).itemRowOn]}
                      onPress={() => toggleItem(item.id)}
                    >
                      <View style={[styles(theme).chk, selected && styles(theme).chkActive]}>
                        {selected && <Feather name="check" size={12} color="#fff" />}
                      </View>
                      <Text style={styles(theme).itemEmoji}>{item.icon || item.emoji || '📋'}</Text>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles(theme).itemName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles(theme).itemMeta}>
                          {item._type === 'habit' ? '🔄' : '⚡'}{' '}
                          {t('reset.completed_count').replace('{count}', String(count))}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </>
          )}

          {/* Divider */}
          <View style={styles(theme).divider} />

          {/* Bottom buttons */}
          <BottomButtons
            leftLabel={t('reset.account_button')}
            leftIcon="trash-2"
            leftDanger
            onLeft={() => setScreen('confirmAccount')}
            rightLabel={t('reset.button')}
            rightIcon="refresh-cw"
            onRight={() => {
              if (selectedIds.size === 0) return;
              setScreen('confirmReset');
            }}
            theme={theme}
          />
        </Card>
      </TouchableWithoutFeedback>
    </AnimatedModalWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = (theme) => StyleSheet.create({
  card: {
    marginHorizontal: 20,
    maxHeight: '86%',
    backgroundColor: theme.card,
    borderRadius: 26,
    borderWidth: 0.5,
    borderColor: theme.border,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 6,
  },
  // Main top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textMain,
    letterSpacing: -0.3,
  },
  topSubtitle: {
    fontSize: 13,
    color: theme.textMuted,
    lineHeight: 18,
    marginBottom: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.border,
    marginBottom: 12,
  },
  // Empty state — completely separate from scroll
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: theme.background,
    borderWidth: 0.5,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textMain,
  },
  emptyDesc: {
    fontSize: 13,
    color: theme.textTertiary,
    textAlign: 'center',
  },
  // Select all
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 11,
    backgroundColor: theme.background,
    borderRadius: 11,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  selectAllText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: theme.textMain,
    marginLeft: 9,
  },
  badge: {
    backgroundColor: 'rgba(249,115,22,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f97316',
  },
  // Item row
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 11,
    marginBottom: 4,
    backgroundColor: theme.background,
    borderWidth: 0.5,
    borderColor: 'transparent',
  },
  itemRowOn: {
    borderColor: 'rgba(249,115,22,0.25)',
    backgroundColor: 'rgba(249,115,22,0.05)',
  },
  itemEmoji: {
    fontSize: 18,
    marginLeft: 9,
    width: 24,
    textAlign: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMain,
  },
  itemMeta: {
    fontSize: 11,
    color: theme.textTertiary,
    marginTop: 1,
  },
  // Checkbox
  chk: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chkActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  // Confirm screens
  confirmTopBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  confirmIconRow: {
    alignItems: 'center',
    marginVertical: 14,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textMain,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmSubtitle: {
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 6,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(244,63,94,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.18)',
  },
  warningBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#f43f5e',
  },
});
