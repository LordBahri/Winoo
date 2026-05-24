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
import { useTheme } from '@hooks/useTheme';
import { useNotifications, useMarkAllRead } from '@hooks/useNotifications';
import { Skeleton } from '@components/ui/Skeleton';
import { formatRelative } from '@lib/format';

const TYPE_EMOJI: Record<string, string> = {
  PET_SCANNED: '📡',
  SIGHTING_REPORTED: '👀',
  PET_FOUND: '✅',
  EMAIL_VERIFICATION: '📧',
  SUBSCRIPTION_EXPIRY: '⏰',
  GENERAL: '🔔',
};

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { data, isLoading, refetch } = useNotifications();
  const markAll = useMarkAllRead();
  const [refreshing, setRefreshing] = React.useState(false);

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <View style={{ gap: 12 }}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} height={72} borderRadius={14} />)}
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🔕</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>All caught up!</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              No notifications yet.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {notifications.map(notif => (
              <TouchableOpacity
                key={notif.id}
                style={[
                  styles.notifItem,
                  {
                    backgroundColor: notif.isRead ? colors.surface : colors.primary + '08',
                    borderColor: notif.isRead ? colors.borderLight : colors.primary + '20',
                  },
                ]}
                activeOpacity={0.75}
              >
                <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={{ fontSize: 20 }}>{TYPE_EMOJI[notif.type] ?? '🔔'}</Text>
                </View>
                <View style={styles.notifContent}>
                  <Text style={[styles.notifTitle, { color: colors.text }]} numberOfLines={1}>
                    {notif.title}
                  </Text>
                  <Text style={[styles.notifBody, { color: colors.textSecondary }]} numberOfLines={2}>
                    {notif.body}
                  </Text>
                  <Text style={[styles.notifTime, { color: colors.textTertiary }]}>
                    {formatRelative(notif.createdAt)}
                  </Text>
                </View>
                {!notif.isRead && (
                  <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  markAll: { fontSize: 14, fontWeight: '600' },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  notifBody: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 14 },
});
