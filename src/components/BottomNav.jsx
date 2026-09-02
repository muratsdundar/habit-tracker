import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, DeviceEventEmitter, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FLAGS } from '../config/flags';

const tabs = [
  { id: 'profile', labelKey: 'nav.profile', icon: 'user' },
  { id: 'home', labelKey: 'nav.home', icon: 'home' },
  { id: 'summary', labelKey: 'nav.stats', icon: 'bar-chart-2' },
];

const NavItem = ({ tab, isActive, isAddMode, onPress, globalIconScale }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const scaleAnim = useRef(new Animated.Value(isActive ? 1 : 0.85)).current;
  const dotOpacity = useRef(new Animated.Value(isActive && !isAddMode ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1 : 0.85,
      useNativeDriver: false,
      friction: 6,
      tension: 60,
    }).start();

    Animated.timing(dotOpacity, {
      toValue: isActive && !isAddMode ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isActive, isAddMode]);

  const iconName = isAddMode ? 'plus' : tab.icon;

  return (
    <TouchableOpacity
      style={styles.navTab}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Animated.View style={[
        styles.iconContainer,
        isAddMode && styles.iconContainerAddMode,
        { 
          transform: [
            { scale: scaleAnim },
            { scale: globalIconScale }
          ] 
        }
      ]}>
        <Feather 
          name={iconName} 
          // Always render at high resolution. Downscaling via transform prevents blurring.
          size={isAddMode ? 28 : 28} 
          color={isAddMode ? '#fff' : (isActive ? theme.accent : theme.textMuted)} 
        />
      </Animated.View>
      
      {/* Subtle Active Indicator Dot */}
      {!isAddMode && (
        <Animated.View style={[styles.activeDot, { opacity: dotOpacity, transform: [{ scale: globalIconScale }] }]} />
      )}
    </TouchableOpacity>
  );
};

const BottomNav = React.memo(function BottomNav({ activeTab, onTabChange, onOpenAddModal }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(theme, insets.bottom);
  const shrinkAnim = useRef(new Animated.Value(0)).current;

  const lastDir = useRef('up');

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('scroll-dir', (dir) => {
      if (lastDir.current === dir) return;
      lastDir.current = dir;
      const toValue = dir === 'down' ? 1 : 0;
      Animated.spring(shrinkAnim, {
        toValue,
        useNativeDriver: false,
        friction: 8,
        tension: 60,
      }).start();
    });
    return () => sub.remove();
  }, [shrinkAnim]);

  const islandWidth = shrinkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['80%', '55%']
  });

  const islandHeight = shrinkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 44]
  });

  const globalIconScale = shrinkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.75]
  });

  return (
    <View style={styles.bottomNav}>
      <Animated.View style={[styles.bottomNavInner, { width: islandWidth, height: islandHeight }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isAddMode = isActive && tab.id === 'home';

          return (
            <NavItem 
              key={tab.id}
              tab={tab}
              isActive={isActive}
              isAddMode={isAddMode}
              globalIconScale={globalIconScale}
              onPress={() => {
                if (isAddMode && onOpenAddModal) {
                  onOpenAddModal();
                } else if (!isActive) {
                  onTabChange(tab.id);
                }
              }}
            />
          );
        })}
      </Animated.View>
    </View>
  );
});

const getStyles = (theme, bottomInset = 0) => {
  const isV2 = FLAGS.ENABLE_UI_V2;
  
  return StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? Math.max(bottomInset - 8, 4) : (isV2 ? 8 : 6),
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bottomNavInner: {
    flexDirection: 'row',
    backgroundColor: theme.bottomNavBg,
    borderRadius: isV2 ? (theme.radii?.full || 9999) : 32,
    padding: isV2 ? 6 : 2,
    borderWidth: isV2 ? 1 : 0.5,
    borderColor: theme.border,
    maxWidth: isV2 ? 280 : 320,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 20,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    height: '100%',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerAddMode: {
    backgroundColor: theme.accent,
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    // Inner glow via shadow
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 16,
    elevation: 12,
    // Outer ring — visible border contrast
    borderWidth: 2,
    borderColor: theme.accent + 'AA',
  },
  activeDot: {
    position: 'absolute',
    bottom: isV2 ? -2 : 2,
    width: isV2 ? 6 : 4,
    height: isV2 ? 6 : 4,
    borderRadius: isV2 ? 3 : 2,
    backgroundColor: theme.accent,
  }
});
}

export default BottomNav;
