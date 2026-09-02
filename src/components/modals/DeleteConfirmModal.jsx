import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import AnimatedModalWrapper from './AnimatedModalWrapper';

export default function DeleteConfirmModal({ isOpen, onConfirm, onCancel }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <AnimatedModalWrapper
      visible={isOpen}
      onClose={onCancel}
      align="center"
      overlayColor="rgba(0,0,0,0.5)"
    >
      <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <Feather name="trash-2" size={24} color={theme.danger} />
          </View>
          
          <Text style={styles.title}>
            {t('modal.delete')}
          </Text>
          
          <Text style={styles.description}>
            {t('modal.delete_confirm')}
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              activeOpacity={0.7}
              style={[styles.button, styles.cancelButton]} 
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>{t('modal.no')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              activeOpacity={0.7}
              style={[styles.button, styles.confirmButton]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>{t('modal.yes')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </AnimatedModalWrapper>
  );
}

const getStyles = (theme) => StyleSheet.create({
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: theme.card,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: theme.border,
    padding: 24,
    alignItems: 'center',
    shadowColor: theme.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    alignSelf: 'center',
    marginHorizontal: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textMain, // var(--text-primary)
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: theme.textMuted, // var(--text-secondary)
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.background, // var(--bg-secondary)
  },
  cancelButtonText: {
    color: theme.textMain, // var(--text-primary)
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: theme.danger,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
