import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@hooks/useTheme';

function TabIcon({
  emoji,
  label,
  focused,
}: {
  emoji: string;
  label: string;
  focused: boolean;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const dotOpacity = useSharedValue(0);

  if (focused) {
    scale.value = withSpring(1.12, { damping: 14, stiffness: 260 });
    dotOpacity.value = withTiming(1, { duration: 200 });
  } else {
    scale.value = withSpring(1, { damping: 14, stiffness: 260 });
    dotOpacity.value = withTiming(0, { duration: 150 });
  }

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scale: dotOpacity.value }],
  }));

  return (
    <View style={styles.tabItem}>
      <Animated.Text style={[{ fontSize: 22 }, iconStyle]}>{emoji}</Animated.Text>
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? colors.primary : colors.textTertiary },
          focused && styles.tabLabelFocused,
        ]}
      >
        {label}
      </Text>
      <Animated.View style={[styles.activeDot, { backgroundColor: colors.primary }, dotStyle]} />
    </View>
  );
}

function ScanTabIcon({ focused }: { focused: boolean }) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  if (focused) {
    scale.value = withSpring(1.08, { damping: 14, stiffness: 280 });
    glow.value = withTiming(1, { duration: 200 });
  } else {
    scale.value = withSpring(1, { damping: 14, stiffness: 280 });
    glow.value = withTiming(0.6, { duration: 200 });
  }

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: glow.value * 0.5,
  }));

  return (
    <Animated.View style={[styles.scanButton, btnStyle]}>
      <Text style={{ fontSize: 26 }}>📡</Text>
    </Animated.View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 16,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pets/index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🐾" label="Pets" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarIcon: ({ focused }) => <ScanTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" label="Map" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Me" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: { alignItems: 'center', gap: 2, paddingTop: 2, position: 'relative' },
  tabLabel: { fontSize: 10, letterSpacing: 0.2 },
  tabLabelFocused: { fontWeight: '700' },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  scanButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
});
