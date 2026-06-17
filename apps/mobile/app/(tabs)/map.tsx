import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@hooks/useTheme';

export default function MapScreen() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>Lost Pets Map</Text>
        <Text style={{ fontSize: 56 }}>🗺️</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Interactive map coming soon.{'\n'}Shows nearby lost pet reports in real-time.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  sub: { fontSize: 15, textAlign: 'center', lineHeight: 24, marginTop: 12 },
});
