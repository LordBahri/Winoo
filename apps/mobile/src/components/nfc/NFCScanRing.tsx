import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const RING_SIZE = width * 0.72;

interface NFCScanRingProps {
  isScanning: boolean;
  color?: string;
}

function Ring({ delay, color, isScanning }: { delay: number; color: string; isScanning: boolean }) {
  const anim = useSharedValue(0);

  useEffect(() => {
    if (isScanning) {
      anim.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration: 2200, easing: Easing.out(Easing.cubic) }),
          -1,
          false,
        ),
      );
    } else {
      anim.value = withTiming(0, { duration: 400 });
    }
  }, [isScanning]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 0.3, 1], [0, 0.6, 0]),
    transform: [{ scale: interpolate(anim.value, [0, 1], [0.4, 1.15]) }],
  }));

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        {
          borderRadius: RING_SIZE / 2,
          borderWidth: 2,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

export function NFCScanRing({ isScanning, color = '#0A84FF' }: NFCScanRingProps) {
  return (
    <View style={styles.container}>
      {[0, 500, 1000].map((delay, i) => (
        <Ring key={i} delay={delay} color={color} isScanning={isScanning} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
