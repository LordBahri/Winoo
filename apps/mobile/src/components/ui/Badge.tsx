import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@hooks/useTheme';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({ label, variant = 'neutral', size = 'md', style }: BadgeProps) {
  const { colors } = useTheme();

  const config: Record<BadgeVariant, { bg: string; text: string }> = {
    success: { bg: `${colors.success}20`, text: colors.success },
    warning: { bg: `${colors.warning}20`, text: colors.warning },
    danger:  { bg: `${colors.danger}20`,  text: colors.danger  },
    info:    { bg: `${colors.info}20`,    text: colors.info    },
    neutral: { bg: colors.surfaceSecondary, text: colors.textSecondary },
  };

  const { bg, text } = config[variant];
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: bg, paddingHorizontal: isSmall ? 8 : 10, paddingVertical: isSmall ? 2 : 4 }, style]}>
      <Text style={[styles.text, { color: text, fontSize: isSmall ? 11 : 12 }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 999, alignSelf: 'flex-start' },
  text: { fontWeight: '600', letterSpacing: 0.2 },
});
