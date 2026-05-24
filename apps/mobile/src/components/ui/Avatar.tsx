import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@hooks/useTheme';

interface AvatarProps {
  name?: string;
  uri?: string;
  size?: number;
  style?: ViewStyle;
  online?: boolean;
}

export function Avatar({ name, uri, size = 40, style, online }: AvatarProps) {
  const { colors } = useTheme();
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <View style={[{ width: size, height: size }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.primary + '20',
            },
          ]}
        >
          <Text style={[styles.initials, { color: colors.primary, fontSize: size * 0.35 }]}>
            {initials}
          </Text>
        </View>
      )}
      {online && (
        <View
          style={[
            styles.onlineDot,
            {
              width: size * 0.27,
              height: size * 0.27,
              borderRadius: size * 0.135,
              right: 0,
              bottom: 0,
              backgroundColor: colors.success,
              borderWidth: 2,
              borderColor: colors.surface,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '700' },
  onlineDot: { position: 'absolute' },
});
