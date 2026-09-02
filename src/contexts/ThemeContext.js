import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FLAGS } from '../config/flags';

export const THEMES = {
  dark: {
    id: 'dark',
    nameKey: 'theme.dark',
    background: '#0f172a',
    card: '#1e293b',
    border: '#334155',
    textMain: '#ffffff',
    textMuted: '#94a3b8',
    textTertiary: '#cbd5e1',
    accent: '#3b82f6',
    accentLight: '#60a5fa',
    success: '#10b981',
    danger: '#f87171',
    bottomNavBg: 'rgba(15, 23, 42, 0.95)',
    modalOverlay: 'rgba(0, 0, 0, 0.6)',
    previewColors: ['#0f172a', '#1e293b', '#3b82f6'],
    isDarkTheme: true,
  },
  light: {
    id: 'light',
    nameKey: 'theme.light',
    background: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    textMain: '#0f172a',
    textMuted: '#64748b',
    textTertiary: '#475569',
    accent: '#3b82f6',
    accentLight: '#93c5fd',
    success: '#10b981',
    danger: '#ef4444',
    bottomNavBg: 'rgba(255, 255, 255, 0.95)',
    modalOverlay: 'rgba(0, 0, 0, 0.4)',
    previewColors: ['#f8fafc', '#ffffff', '#3b82f6'],
    isDarkTheme: false,
  },
  cyberpunk: {
    id: 'cyberpunk',
    nameKey: 'theme.cyberpunk',
    background: '#0c0f1d',
    card: '#14192f',
    border: '#2a1b4e',
    textMain: '#ffffff',
    textMuted: '#8b9bb4',
    textTertiary: '#cbd5e1',
    accent: '#ff007f',
    accentLight: '#ff71ce',
    success: '#05ffa1',
    danger: '#ff2a2a',
    bottomNavBg: 'rgba(12, 15, 29, 0.95)',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    previewColors: ['#0c0f1d', '#14192f', '#ff007f'],
    isDarkTheme: true,
  },
  forest: {
    id: 'forest',
    nameKey: 'theme.forest',
    background: '#0f1914',
    card: '#1b2e24',
    border: '#2d4a3b',
    textMain: '#ffffff',
    textMuted: '#8ba395',
    textTertiary: '#cbd5e1',
    accent: '#10b981',
    accentLight: '#34d399',
    success: '#05ffa1',
    danger: '#ef4444',
    bottomNavBg: 'rgba(15, 25, 20, 0.95)',
    modalOverlay: 'rgba(0, 0, 0, 0.65)',
    previewColors: ['#0f1914', '#1b2e24', '#10b981'],
    isDarkTheme: true,
  },
  sakura: {
    id: 'sakura',
    nameKey: 'theme.sakura',
    background: '#1c1417',
    card: '#2f1e24',
    border: '#4d2d38',
    textMain: '#ffffff',
    textMuted: '#bda2ab',
    textTertiary: '#e2d4d8',
    accent: '#f472b6',
    accentLight: '#fbcfe8',
    success: '#34d399',
    danger: '#f87171',
    bottomNavBg: 'rgba(28, 20, 23, 0.95)',
    modalOverlay: 'rgba(0, 0, 0, 0.65)',
    previewColors: ['#1c1417', '#2f1e24', '#f472b6'],
    isDarkTheme: true,
  },
  gold: {
    id: 'gold',
    nameKey: 'theme.gold',
    background: '#0f1011',
    card: '#1a1c1e',
    border: '#3a3328',
    textMain: '#ffffff',
    textMuted: '#baa585',
    textTertiary: '#dfd5c6',
    accent: '#fbbf24',
    accentLight: '#fef08a',
    success: '#10b981',
    danger: '#f87171',
    bottomNavBg: 'rgba(15, 16, 17, 0.95)',
    modalOverlay: 'rgba(0, 0, 0, 0.75)',
    previewColors: ['#0f1011', '#1a1c1e', '#fbbf24'],
    isDarkTheme: true,
  }
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentThemeId, setCurrentThemeId] = useState('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  const loadThemeSettings = useCallback(async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@app_theme_id');
      if (savedTheme && THEMES[savedTheme]) {
        setCurrentThemeId(savedTheme);
      } else {
        const legacyDark = await AsyncStorage.getItem('@app_theme');
        if (legacyDark !== null) {
          setCurrentThemeId(legacyDark === 'dark' ? 'dark' : 'light');
        }
      }
    } catch (error) {
      console.log('Error loading theme settings:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadThemeSettings();
  }, [loadThemeSettings]);

  const setTheme = async (themeId) => {
    if (!THEMES[themeId]) return;
    try {
      setCurrentThemeId(themeId);
      await AsyncStorage.setItem('@app_theme_id', themeId);
      await AsyncStorage.setItem('@app_theme', THEMES[themeId].isDarkTheme ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme settings:', error);
    }
  };



  const toggleTheme = async () => {
    const nextThemeId = currentThemeId === 'dark' ? 'light' : 'dark';
    await setTheme(nextThemeId);
  };

  let theme = THEMES[currentThemeId] || THEMES.dark;
  
  if (FLAGS.ENABLE_UI_V2) {
    // V2 Typography and Spacing Overrides
    theme = {
      ...theme,
      spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
      radii: { sm: 8, md: 16, lg: 24, full: 9999 },
      fonts: {
        regular: 'Outfit_400Regular',
        medium: 'Outfit_500Medium',
        semiBold: 'Outfit_600SemiBold',
        bold: 'Outfit_700Bold',
      }
    };
    
    // Optionally tweak the colors for a more modern, premium feel in V2
    if (theme.id === 'dark') {
      theme.background = '#09090b'; // Deep OLED-friendly black
      theme.card = '#18181b'; // Slightly lighter slate
      theme.accent = '#6366f1'; // Modern indigo
      theme.border = '#27272a';
      theme.bottomNavBg = 'rgba(24, 24, 27, 0.97)'; // Match card color, no more navy
    }
  }

  const isDark = theme.isDarkTheme;

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ 
      currentThemeId, 
      theme, 
      isDark, 
      setTheme, 
      toggleTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
