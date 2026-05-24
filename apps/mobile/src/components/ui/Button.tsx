import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@hooks/useTheme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
  textStyle,
}: ButtonProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 20, stiffness: 400 });
    opacity.value = withTiming(0.85, { duration: 60 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const containerStyle: ViewStyle[] = [
    styles.base,
    sizeStyles[size],
    fullWidth ? styles.fullWidth : styles.inline,
  ];

  const textVariantStyle: TextStyle = {
    ...sizeTextStyles[size],
    color:
      variant === 'primary'
        ? '#FFFFFF'
        : variant === 'danger'
        ? colors.danger
        : variant === 'outline'
        ? colors.primary
        : variant === 'ghost'
        ? colors.textSecondary
        : colors.text,
  };

  const bgColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
      ? isDark ? colors.surfaceTertiary : colors.surfaceSecondary
      : variant === 'danger'
      ? isDark ? 'rgba(255,59,48,0.15)' : 'rgba(255,59,48,0.1)'
      : variant === 'outline'
      ? 'transparent'
      : 'transparent';

  const borderStyle: ViewStyle =
    variant === 'outline'
      ? { borderWidth: 1.5, borderColor: colors.primary }
      : variant === 'danger'
      ? { borderWidth: 1.5, borderColor: colors.danger }
      : {};

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
      style={[
        animatedStyle,
        containerStyle,
        { backgroundColor: bgColor },
        borderStyle,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFF' : colors.primary}
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text
            style={[styles.text, textVariantStyle, textStyle]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  inline: { alignSelf: 'flex-start' },
  content: { flexDirection: 'row', alignItems: 'center' },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
  text: { fontWeight: '600', letterSpacing: -0.3 },
  disabled: { opacity: 0.5 },
});

const sizeStyles: Record<Size, ViewStyle> = {
  sm: { height: 36, paddingHorizontal: 16 },
  md: { height: 52, paddingHorizontal: 20 },
  lg: { height: 58, paddingHorizontal: 24 },
};

const sizeTextStyles: Record<Size, TextStyle> = {
  sm: { fontSize: 14 },
  md: { fontSize: 17 },
  lg: { fontSize: 18 },
};
