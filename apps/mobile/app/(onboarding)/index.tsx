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
  withSpring,
  interpolate,
  Extrapolation,
  FadeInDown,
  FadeOutUp,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    emoji: '🐾',
    title: 'Never Lose\nYour Pet Again',
    subtitle:
      'Smart NFC tags keep your furry friends safe and connected. Anyone can scan — no app required.',
    accent: '#0A84FF',
    bg: '#020B18',
  },
  {
    id: '2',
    emoji: '📡',
    title: 'One Tap.\nInstant Profile.',
    subtitle:
      "A stranger finds your pet and taps their phone to the tag — your contact info appears immediately.",
    accent: '#30D158',
    bg: '#011209',
  },
  {
    id: '3',
    emoji: '🛡️',
    title: 'Military-Grade\nTag Security',
    subtitle:
      'NTAG424 DNA chips generate a unique cryptographic code on every scan. Your tag cannot be cloned.',
    accent: '#FF9F0A',
    bg: '#120800',
  },
  {
    id: '4',
    emoji: '🏠',
    title: 'Your Community\nHas Their Back',
    subtitle:
      'Lost pet alerts notify nearby users. Real-time sightings map the way home.',
    accent: '#BF5AF2',
    bg: '#0B0012',
  },
];

function Slide({ item, scrollX, index }: { item: typeof SLIDES[0]; scrollX: Animated.SharedValue<number>; index: number }) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          scrollX.value,
          inputRange,
          [0.7, 1, 0.7],
          Extrapolation.CLAMP,
        ),
      },
      {
        translateY: interpolate(
          scrollX.value,
          inputRange,
          [20, 0, 20],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollX.value,
          inputRange,
          [30, 0, -30],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View style={[styles.slide, { width, backgroundColor: item.bg }]}>
      {/* Radial glow */}
      <View style={[styles.glow, { backgroundColor: item.accent + '22' }]} />

      <Animated.Text style={[styles.emoji, emojiStyle]}>{item.emoji}</Animated.Text>
      <Animated.View style={textStyle}>
        <Text style={[styles.title, { color: '#fff' }]}>{item.title}</Text>
        <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.65)' }]}>
          {item.subtitle}
        </Text>
      </Animated.View>
    </View>
  );
}

export default function OnboardingScreen() {
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

  const isLast = activeIndex === SLIDES.length - 1;
  const accent = SLIDES[activeIndex]?.accent ?? '#0A84FF';

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
        onScroll={e => {
          scrollX.value = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <Slide item={item} scrollX={scrollX} index={index} />
        )}
        keyExtractor={item => item.id}
      />

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const isActive = i === activeIndex;
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive ? accent : 'rgba(255,255,255,0.25)',
                    width: isActive ? 28 : 8,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: accent }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>{isLast ? 'Get Started' : 'Continue'}</Text>
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            style={styles.skip}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  glow: {
    position: 'absolute',
    top: height * 0.1,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    alignSelf: 'center',
  },
  emoji: { fontSize: 100, marginBottom: 44, textAlign: 'center' },
  title: {
    fontSize: 38,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 46,
    letterSpacing: -1,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
    alignSelf: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: 12,
    gap: 0,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 28,
  },
  dot: { height: 8, borderRadius: 4 },
  ctaBtn: {
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  skip: { alignItems: 'center', paddingVertical: 10 },
  skipText: { color: 'rgba(255,255,255,0.45)', fontSize: 16 },
});
