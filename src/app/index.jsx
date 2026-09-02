import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, DeviceEventEmitter, ScrollView, Dimensions, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { useTheme } from '../contexts/ThemeContext';
import AuthPage from '../pages/AuthPage';
import HomePage from '../pages/HomePage';
import ProfilePage from '../pages/ProfilePage';
import HabitSumPage from '../pages/HabitSumPage';
import BottomNav from '../components/BottomNav';

export default function AppIndex() {
  const { theme } = useTheme();
  const [currentUser, setCurrentUser, isLoading] = useAsyncStorage('habit-tracker-currentUser', null);
  const [activeTab, setActiveTab] = useAsyncStorage('habit-tracker-active-tab', 'home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // Global trigger
  const insets = useSafeAreaInsets();

  const scrollViewRef = useRef(null);
  const { width: windowWidth } = Dimensions.get('window');
  const [containerWidth, setContainerWidth] = useState(Platform.OS === 'web' ? Math.min(windowWidth, 480) : windowWidth);
  const tabOrder = ['profile', 'home', 'summary'];

  // Sync scroll view when activeTab changes (from BottomNav click)
  useEffect(() => {
    const targetIndex = tabOrder.indexOf(activeTab);
    if (targetIndex !== -1 && scrollViewRef.current && containerWidth > 0) {
      scrollViewRef.current.scrollTo({ x: targetIndex * containerWidth, animated: true });
    }
  }, [activeTab, containerWidth]);

  const handleScrollEnd = (event) => {
    if (containerWidth === 0) return;
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / containerWidth);
    if (newIndex >= 0 && newIndex < tabOrder.length) {
      const newTab = tabOrder[newIndex];
      if (newTab !== activeTab) {
        setActiveTab(newTab);
      }
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={styles.container}>
        <AuthPage onLogin={setCurrentUser} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.appShell} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
          contentOffset={{ x: Math.max(0, tabOrder.indexOf(activeTab)) * containerWidth, y: 0 }}
          style={styles.swipeContainer}
          contentContainerStyle={styles.swipeContentContainer}
        >
          <View style={[styles.tabPage, { width: containerWidth }]}>
            <ProfilePage user={currentUser} onLogout={() => setCurrentUser(null)} isActive={activeTab === 'profile'} />
          </View>
          <View style={[styles.tabPage, { width: containerWidth }]}>
            <HomePage user={currentUser} isActive={activeTab === 'home'} />
          </View>
          <View style={[styles.tabPage, { width: containerWidth }]}>
            <HabitSumPage user={currentUser} isActive={activeTab === 'summary'} />
          </View>
        </ScrollView>
        <BottomNav 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          onOpenAddModal={() => DeviceEventEmitter.emit('open-add-modal')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appShell: {
    flex: 1,
    overflow: 'hidden',
  },
  swipeContainer: {
    flex: 1,
  },
  swipeContentContainer: {
    // flex: 1 on the horizontal ScrollView's contentContainer allows children
    // to stretch their full height, fixing the "bottom half only" clustering bug.
    flexGrow: 1,
  },
  tabPage: {
    // Each tab page must fill the full vertical space of the scroll view.
    // Without this, pages only take up as much height as their content
    // which causes them to render squashed at the bottom.
    flexGrow: 1,
    overflow: 'hidden',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

