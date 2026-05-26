import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';

interface NFCScanRingProps {
  status?: ScanStatus;
  /** @deprecated use status */
  isScanning?: boolean;
  color?: string;
}

const STATUS_COLORS: Record<ScanStatus, string> = {
  idle:     '#0A84FF',
  scanning: '#0A84FF',
  success:  '#30D158',
  error:    '#FF453A',
};

const RING_SIZES = [120, 200, 280] as const;
const RING_OPACITIES = [0.7, 0.45, 0.25] as const;

function PulseRing({
  size,
  baseOpacity,
  delay,
  color,
  active,
  speed,
}: {
  size: number;
  baseOpacity: number;
  delay: number;
  color: string;
  active: boolean;
  speed: number;
}) {
  const anim = useSharedValue(0);

  useEffect(() => {
    if (active) {
      anim.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration: speed, easing: Easing.out(Easing.cubic) }),
          -1,
          false,
        ),
      );
    } else {
      anim.value = withTiming(0, { duration: 500 });
    }
  }, [active, speed]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 0.25, 1], [0, baseOpacity, 0]),
    transform: [{ scale: interpolate(anim.value, [0, 1], [0.35, 1.1]) }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

function IdleRing({ color }: { color: string }) {
  const breathe = useSharedValue(1);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.95, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
    opacity: 0.35,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 160,
          height: 160,
          borderRadius: 80,
          borderWidth: 1.5,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

function SuccessRing({ color }: { color: string }) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 160,
          height: 160,
          borderRadius: 80,
          borderWidth: 3,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

export function NFCScanRing({ status, isScanning, color }: NFCScanRingProps) {
  const resolvedStatus: ScanStatus = status ?? (isScanning ? 'scanning' : 'idle');
  const ringColor = color ?? STATUS_COLORS[resolvedStatus];
  const isActive = resolvedStatus === 'scanning';
  const speed = 2000;

  return (
    <View style={styles.container}>
      {resolvedStatus === 'idle' && <IdleRing color={ringColor} />}
      {(resolvedStatus === 'success' || resolvedStatus === 'error') && (
        <SuccessRing color={ringColor} />
      )}
      {RING_SIZES.map((size, i) => (
        <PulseRing
          key={size}
          size={size}
          baseOpacity={RING_OPACITIES[i]!}
          delay={i * 450}
          color={ringColor}
          active={isActive}
          speed={speed}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
