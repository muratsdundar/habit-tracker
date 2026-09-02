import { Slot } from 'expo-router';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { View, Platform, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import '../utils/notificationUtils';
import ErrorBoundary from '../components/ErrorBoundary';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.body.style.backgroundColor = '#0F172A';
    }
  }, []);

  if (!fontsLoaded) {
    return null; // Or a splash screen
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <View style={styles.container}>
            <Slot />
          </View>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Platform.OS === 'web' ? '100vh' : '100%',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : '100%',
    marginHorizontal: 'auto',
    backgroundColor: '#0F172A', // App's background color so it blends nicely
  },
});
