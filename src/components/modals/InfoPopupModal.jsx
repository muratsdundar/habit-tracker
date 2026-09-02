import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import AnimatedModalWrapper from './AnimatedModalWrapper';

export default function InfoPopupModal({ visible, onClose, title, description, icon = "info" }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  // Render description beautifully
  const renderDescription = () => {
    if (!description) return null;
    const lines = description.split('\\n'); // Handle literal \n string from JSX props
    // Also handle actual newlines if any
    const allLines = lines.flatMap(l => l.split('\n')).filter(l => l.trim() !== '');

    return allLines.map((line, index) => {
      const isBullet = line.trim().startsWith('•');
      const text = isBullet ? line.replace('•', '').trim() : line.trim();
      
      if (isBullet) {
        return (
          <View key={index} style={styles.bulletRow}>
            <View style={styles.bulletIcon}>
              <Feather name="check" size={14} color={theme.accent} />
            </View>
            <Text style={styles.bulletText}>{text}</Text>
          </View>
        );
      }
      
      return (
        <Text key={index} style={[styles.description, index > 0 && { marginTop: 12 }]}>
          {text}
        </Text>
      );
    });
  };

  if (!visible) return null;

  return (
    <AnimatedModalWrapper
      visible={visible}
      onClose={onClose}
      align="center"
      overlayColor="rgba(0,0,0,0.5)"
    >
      <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
        <View style={styles.popupContent}>
          <View style={styles.iconCircle}>
            <Feather name={icon} size={28} color={theme.accent} />
          </View>
          <Text style={styles.title}>{title}</Text>
          
          <View style={styles.descContainer}>
            {renderDescription()}
          </View>

          <TouchableOpacity style={styles.gotItButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.gotItText}>Anladım</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </AnimatedModalWrapper>
  );
}

const getStyles = (theme) => StyleSheet.create({
  popupContent: {
    backgroundColor: theme.card,
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: 0.5,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.accent + '1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.accent + '33',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.textMain,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  descContainer: {
    width: '100%',
    marginBottom: 28,
  },
  description: {
    fontSize: 15,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  bulletIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.accent + '26',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: theme.textMain,
  },
  gotItButton: {
    backgroundColor: theme.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
  },
  gotItText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
