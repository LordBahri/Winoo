import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '@hooks/useTheme';
import { Button } from '@components/ui/Button';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    emoji: '🐾',
    title: 'Never Lose\nYour Pet Again',
    subtitle: 'Smart NFC tags keep your furry friends safe. Tap any NFC device to instantly show your pet\'s profile.',
    bg: '#0A84FF',
  },
  {
    id: '2',
    emoji: '📡',
    title: 'Instant\nNFC Scanning',
    subtitle: 'Anyone who finds your pet can tap their phone to the tag — no app needed — and instantly see how to reach you.',
    bg: '#34C759',
  },
  {
    id: '3',
    emoji: '🏥',
    title: 'Health Records\nAlways Ready',
    subtitle: 'Store vaccinations, medications, and vet visits in one place. Share them instantly with any vet.',
    bg: '#FF9500',
  },
  {
    id: '4',
    emoji: '🗺️',
    title: 'Community\nWatch Network',
    subtitle: 'When a pet goes missing, your whole neighborhood gets notified. Real-time sightings map the way home.',
    bg: '#AF52DE',
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const handleViewableItemsChanged = ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) setActiveIndex(viewableItems[0].index ?? 0);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        onScroll={e => { scrollX.value = e.nativeEvent.contentOffset.x; }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width, backgroundColor: item.bg }]}>
            <SafeAreaView style={styles.safeSlide}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </SafeAreaView>
          </View>
        )}
        keyExtractor={item => item.id}
      />

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.4)',
                  width: i === activeIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.actions}>
          <Button
            label={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
            onPress={handleNext}
            style={styles.continueBtn}
            textStyle={{ color: SLIDES[activeIndex].bg }}
          />
          {activeIndex < SLIDES.length - 1 && (
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.skip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  safeSlide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emoji: { fontSize: 80, marginBottom: 32 },
  title: { fontSize: 36, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 44, marginBottom: 16 },
  subtitle: { fontSize: 18, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 26 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 24 },
  dot: { height: 8, borderRadius: 4 },
  actions: { gap: 12 },
  continueBtn: { backgroundColor: '#fff', borderRadius: 14, height: 56 },
  skip: { alignItems: 'center', paddingVertical: 8 },
  skipText: { color: 'rgba(255,255,255,0.7)', fontSize: 16 },
});
