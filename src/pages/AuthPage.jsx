import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { useTheme } from '../contexts/ThemeContext';

export default function AuthPage({ onLogin }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useAsyncStorage('habit-tracker-users', []);
  const [mode, setMode] = useState('login'); // login | register | forgot-pass | forgot-user

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = () => {
    if (!username || !password || !email) {
      setMessage(t('auth.err_fill_all'));
      return;
    }
    if (users && users.find(u => u.username === username)) {
      setMessage(t('auth.err_username_taken'));
      return;
    }
    
    const newUser = { username, password, email, joinDate: Date.now() };
    const currentUsers = users || [];
    setUsers([...currentUsers, newUser]);
    onLogin(newUser);
  };

  const handleLogin = () => {
    // Admin Account Bypass
    if (username === 'murat' && password === 'msd2004') {
      const adminUser = { username: 'murat', password: 'msd2004', email: 'admin@habit.com', joinDate: Date.now(), isAdmin: true };
      
      const currentUsers = users || [];
      if (!currentUsers.find(u => u.username === 'murat')) {
        setUsers([...currentUsers, adminUser]);
      }
      
      onLogin(adminUser);
      return;
    }

    // Sami's Account Bypass
    if (username === 'sami' && password === 'msd2010') {
      const currentUsers = users || [];
      let samiUser = currentUsers.find(u => u.username === 'sami');
      if (!samiUser) {
        samiUser = { username: 'sami', password: 'msd2010', email: 'sami@habit.com', joinDate: Date.now() };
        setUsers([...currentUsers, samiUser]);
      }
      onLogin(samiUser);
      return;
    }

    const currentUsers = users || [];
    const user = currentUsers.find(u => u.username === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setMessage(t('auth.err_invalid_login'));
    }
  };

  const handleSimulateReset = () => {
    if (!email) {
      setMessage(t('auth.err_enter_email'));
      return;
    }
    setMessage(mode === 'forgot-pass' ? t('auth.msg_reset_sent') : t('auth.msg_username_sent'));
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20) }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.authBox}>
          <View style={styles.header}>
            <Text style={styles.logo}>🚀</Text>
            <Text style={styles.title}>{t('auth.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
          </View>
          
          {mode === 'login' && (
            <View style={styles.formGroup}>
              <TextInput 
                style={styles.input}
                placeholder={t('auth.username')}
                placeholderTextColor={theme.textTertiary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <TextInput 
                style={styles.input}
                placeholder={t('auth.password')}
                placeholderTextColor={theme.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              {!!message && <Text style={styles.errorText}>{message}</Text>}
              
              <TouchableOpacity activeOpacity={0.7} style={styles.btnPrimary} onPress={handleLogin}>
                <Text style={styles.btnPrimaryText}>{t('auth.login')}</Text>
              </TouchableOpacity>
              
              <View style={styles.linksRow}>
                <TouchableOpacity onPress={() => {setMode('forgot-pass'); setMessage('');}}>
                  <Text style={styles.linkText}>{t('auth.forgot_password')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {setMode('forgot-user'); setMessage('');}}>
                  <Text style={styles.linkText}>{t('auth.forgot_username')}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.divider} />
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>{t('auth.no_account')} </Text>
                <TouchableOpacity onPress={() => {setMode('register'); setMessage('');}}>
                  <Text style={styles.linkTextBold}>{t('auth.create_account')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {mode === 'register' && (
            <View style={styles.formGroup}>
              <TextInput 
                style={styles.input}
                placeholder={t('auth.username')}
                placeholderTextColor={theme.textTertiary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <TextInput 
                style={styles.input}
                placeholder={t('auth.email')}
                placeholderTextColor={theme.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput 
                style={styles.input}
                placeholder={t('auth.password')}
                placeholderTextColor={theme.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              {!!message && <Text style={styles.errorText}>{message}</Text>}
              
              <TouchableOpacity activeOpacity={0.7} style={styles.btnPrimary} onPress={handleRegister}>
                <Text style={styles.btnPrimaryText}>{t('auth.register')}</Text>
              </TouchableOpacity>
              
              <View style={styles.divider} />
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>{t('auth.have_account')} </Text>
                <TouchableOpacity onPress={() => {setMode('login'); setMessage('');}}>
                  <Text style={styles.linkTextBold}>{t('auth.login')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {(mode === 'forgot-pass' || mode === 'forgot-user') && (
            <View style={styles.formGroup}>
              <Text style={styles.formTitle}>
                {mode === 'forgot-pass' ? t('auth.reset_password') : t('auth.recover_username')}
              </Text>
              <TextInput 
                style={styles.input}
                placeholder={t('auth.email')}
                placeholderTextColor={theme.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {!!message && (
                <Text style={[styles.errorText, message.includes('Simülasyon') && styles.successText]}>
                  {message}
                </Text>
              )}
              
              <TouchableOpacity activeOpacity={0.7} style={styles.btnPrimary} onPress={handleSimulateReset}>
                <Text style={styles.btnPrimaryText}>
                  {mode === 'forgot-pass' ? t('auth.reset_password') : t('auth.recover_username')}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.divider} />
              <TouchableOpacity style={styles.btnSecondary} onPress={() => {setMode('login'); setMessage('');}}>
                <Text style={styles.btnSecondaryText}>{t('auth.back_to_login')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background, // Dark theme background
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  authBox: {
    backgroundColor: theme.card,
    borderRadius: 32, // Squircle
    padding: 32,
    borderWidth: 0.5,
    borderColor: theme.border,
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 48,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.textMain,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
  },
  formGroup: {
    gap: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textMain,
    textAlign: 'center',
    marginBottom: 10,
  },
  input: {
    backgroundColor: theme.background,
    borderWidth: 0.5,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 16,
    color: theme.textMain,
    fontSize: 16,
    marginBottom: 16,
  },
  btnPrimary: {
    backgroundColor: theme.accent,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnSecondary: {
    padding: 16,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: theme.textMuted,
    fontSize: 16,
  },
  errorText: {
    color: theme.danger,
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 10,
  },
  successText: {
    color: theme.success,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  linkText: {
    color: theme.textMuted,
    fontSize: 14,
  },
  linkTextBold: {
    color: theme.accent,
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  switchText: {
    color: theme.textMuted,
    fontSize: 14,
  },
});
