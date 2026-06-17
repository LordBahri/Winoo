import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@hooks/useTheme';
import { useNotifications, useMarkAllRead } from '@hooks/useNotifications';
import { Skeleton } from '@components/ui/Skeleton';
import { formatRelative } from '@lib/format';
import type { Notification } from '@/types';

const TYPE_CONFIG: Record<string, { emoji: string; color: string }> = {
  PET_SCANNED:          { emoji: '📡', color: '#0A84FF' },
  SIGHTING_REPORTED:    { emoji: '👀', color: '#FF9F0A' },
  PET_FOUND:            { emoji: '✅', color: '#30D158' },
  EMAIL_VERIFICATION:   { emoji: '📧', color: '#0A84FF' },
  SUBSCRIPTION_EXPIRY:  { emoji: '⏰', color: '#FF9F0A' },
  GENERAL:              { emoji: '🔔', color: '#636366' },
};

function NotifItem({ notif, delay }: { notif: Notification; delay: number }) {
  const { colors } = useTheme();
  const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.GENERAL!;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(350).springify()}>
      <TouchableOpacity
        style={[
          styles.notifItem,
          {
            backgroundColor: notif.isRead ? colors.surface : colors.primary + '08',
            borderColor: notif.isRead ? 'transparent' : colors.primary + '18',
          },
        ]}
        activeOpacity={0.75}
      >
        <View style={[styles.iconWrap, { backgroundColor: config.color + '18' }]}>
          <Text style={styles.iconText}>{config.emoji}</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {notif.title}
            </Text>
            <Text style={[styles.time, { color: colors.textTertiary }]}>
              {formatRelative(notif.createdAt)}
            </Text>
          </View>
          <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={2}>
            {notif.body}
          </Text>
        </View>
        {!notif.isRead && (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { data, isLoading, refetch } = useNotifications();
  const markAll = useMarkAllRead();
  const [refreshing, setRefreshing] = React.useState(false);

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayItems = notifications.filter(
    (n: Notification) => new Date(n.createdAt) >= today,
  );
  const earlierItems = notifications.filter(
    (n: Notification) => new Date(n.createdAt) < today,
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerBackTitle: 'Home',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerRight: () =>
            unreadCount > 0 ? (
              <TouchableOpacity onPress={() => markAll.mutate()}>
                <Text style={[styles.markAll, { color: colors.primary }]}>Mark all read</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <View style={{ gap: 10 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} height={74} borderRadius={16} />
            ))}
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🐾</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>All caught up!</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Notifications about scans, lost pets, and more will appear here.
            </Text>
          </View>
        ) : (
          <>
            {todayItems.length > 0 && (
              <View style={styles.group}>
                <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>Today</Text>
                <View style={{ gap: 8 }}>
                  {todayItems.map((n: Notification, i: number) => (
                    <NotifItem key={n.id} notif={n} delay={i * 40} />
                  ))}
                </View>
              </View>
            )}
            {earlierItems.length > 0 && (
              <View style={styles.group}>
                <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>Earlier</Text>
                <View style={{ gap: 8 }}>
                  {earlierItems.map((n: Notification, i: number) => (
                    <NotifItem key={n.id} notif={n} delay={i * 30} />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  markAll: { fontSize: 14, fontWeight: '600' },

  group: { marginBottom: 24 },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingLeft: 4,
  },

  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: { fontSize: 20 },
  content: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  body: { fontSize: 13, lineHeight: 18 },
  time: { fontSize: 11, flexShrink: 0 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },

  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyEmoji: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  emptySub: { fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
});
