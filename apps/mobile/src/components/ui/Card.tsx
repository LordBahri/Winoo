import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { Shadow } from '@theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: number;
}

export function Card({ children, style, variant = 'elevated', padding = 16 }: CardProps) {
  const { colors } = useTheme();

  const variantStyle: ViewStyle =
    variant === 'elevated'
      ? { backgroundColor: colors.surface, ...Shadow.md }
      : variant === 'outlined'
      ? { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
      : { backgroundColor: colors.surfaceSecondary };

  return (
    <View style={[styles.card, variantStyle, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden' },
});
