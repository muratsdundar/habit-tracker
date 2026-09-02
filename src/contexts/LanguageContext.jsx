import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('tr'); // default to 'tr'

  // Load saved language on mount
  useEffect(() => {
    AsyncStorage.getItem('habit-tracker-lang').then((savedLang) => {
      if (savedLang && (savedLang === 'en' || savedLang === 'tr')) {
        setLanguage(savedLang);
      }
    });
  }, []);

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    await AsyncStorage.setItem('habit-tracker-lang', lang);
  };

  const t = (key, params = {}) => {
    let str = translations[language][key];
    if (!str) {
      console.warn(`Translation key not found: ${key}`);
      return key; // fallback to key
    }

    // Replace params like {username} with actual values
    Object.keys(params).forEach(param => {
      str = str.replace(`{${param}}`, params[param]);
    });

    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
