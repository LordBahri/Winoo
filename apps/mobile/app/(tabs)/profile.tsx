import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@stores/auth.store';
import { usePets } from '@hooks/usePets';
import { Avatar } from '@components/ui/Avatar';
import { Badge } from '@components/ui/Badge';
import type { Pet } from '@/types';

interface SettingRow {
  emoji: string;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}

const PLAN_COLORS: Record<string, string> = {
  PRO:        '#BF5AF2',
  PREMIUM:    '#FF9F0A',
  FREE:       '#636366',
};

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const { user, logout } = useAuthStore();
  const { data: petsData } = usePets();
  const pets = petsData?.data ?? [];

  const plan = user?.subscription?.plan ?? 'FREE';
  const planColor = PLAN_COLORS[plan] ?? '#636366';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const SETTING_GROUPS: { title: string; rows: SettingRow[] }[] = [
    {
      title: 'Account',
      rows: [
        { emoji: '👤', label: 'Edit Profile', onPress: () => {} },
        { emoji: '🔒', label: 'Change Password', onPress: () => {} },
        { emoji: '📱', label: 'NFC Tag Manager', onPress: () => {} },
      ],
    },
    {
      title: 'Preferences',
      rows: [
        { emoji: '🔔', label: 'Notifications', onPress: () => {} },
        { emoji: '🌙', label: 'Appearance', onPress: () => {} },
        { emoji: '💳', label: 'Subscription', value: plan, onPress: () => {} },
      ],
    },
    {
      title: 'Support',
      rows: [
        { emoji: '❓', label: 'Help & FAQ', onPress: () => {} },
        { emoji: '💬', label: 'Chat Support', onPress: () => {} },
        { emoji: '📋', label: 'Privacy Policy', onPress: () => {} },
        { emoji: '⭐', label: 'Rate PetID', onPress: () => {} },
      ],
    },
  ];

  const stats = [
    { label: 'Pets', value: pets.length },
    { label: 'Tagged', value: (pets as Pet[]).filter((p: Pet) => !!p.nfcTag).length },
    { label: 'Safe', value: (pets as Pet[]).filter((p: Pet) => !p.isLost).length },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Profile</Text>

        {/* User card */}
        <Animated.View
          entering={FadeInDown.delay(0).duration(400).springify()}
          style={[styles.userCard, { backgroundColor: colors.surface }]}
        >
          <View style={styles.userCardTop}>
            <Avatar name={user?.name} uri={user?.avatarUrl} size={68} />
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                {user?.name ?? 'Pet Parent'}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                {user?.email}
              </Text>
              <View style={styles.userBadges}>
                <View style={[styles.planBadge, { backgroundColor: planColor + '20', borderColor: planColor + '40' }]}>
                  <Text style={[styles.planBadgeText, { color: planColor }]}>{plan}</Text>
                </View>
                {user?.isEmailVerified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: '#30D15820', borderColor: '#30D15840' }]}>
                    <Text style={[styles.verifiedText, { color: '#30D158' }]}>✓ Verified</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Stats row */}
          <View style={[styles.statsRow, { borderTopColor: colors.separator }]}>
            {stats.map((stat, i) => (
              <React.Fragment key={stat.label}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{stat.label}</Text>
                </View>
                {i < stats.length - 1 && (
                  <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </Animated.View>

        {/* Settings groups */}
        {SETTING_GROUPS.map((group, gi) => (
          <Animated.View
            key={group.title}
            entering={FadeInDown.delay(gi * 80 + 120).duration(380).springify()}
            style={styles.group}
          >
            <Text style={[styles.groupTitle, { color: colors.textTertiary }]}>{group.title}</Text>
            <View style={[styles.groupCard, { backgroundColor: colors.surface }]}>
              {group.rows.map((row, ri) => (
                <TouchableOpacity
                  key={row.label}
                  style={[
                    styles.settingRow,
                    ri < group.rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
                  ]}
                  onPress={row.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.rowIconWrap, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={styles.rowEmoji}>{row.emoji}</Text>
                  </View>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>{row.label}</Text>
                  {row.value && (
                    <View style={[styles.valuePill, { backgroundColor: planColor + '18' }]}>
                      <Text style={[styles.valuePillText, { color: planColor }]}>{row.value}</Text>
                    </View>
                  )}
                  <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        ))}

        {/* Sign out */}
        <Animated.View entering={FadeInDown.delay(420).duration(380).springify()}>
          <TouchableOpacity
            style={[styles.signOutBtn, { backgroundColor: colors.danger + '12', borderColor: colors.danger + '25' }]}
            onPress={handleLogout}
            activeOpacity={0.75}
          >
            <Text style={styles.signOutEmoji}>🚪</Text>
            <Text style={[styles.signOutText, { color: colors.danger }]}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={[styles.version, { color: colors.textTertiary }]}>PetID v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6, marginTop: 8, marginBottom: 20 },

  userCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  userCardTop: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  userEmail: { fontSize: 13 },
  userBadges: { flexDirection: 'row', gap: 6, marginTop: 4 },
  planBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  planBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  verifiedBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  verifiedText: { fontSize: 11, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontWeight: '500' },
  statDivider: { width: StyleSheet.hairlineWidth, marginVertical: 4 },

  group: { marginBottom: 24 },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingLeft: 4,
  },
  groupCard: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  rowIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowEmoji: { fontSize: 18 },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '500' },
  valuePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  valuePillText: { fontSize: 12, fontWeight: '700' },
  chevron: { fontSize: 20, fontWeight: '300' },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  signOutEmoji: { fontSize: 18 },
  signOutText: { fontSize: 16, fontWeight: '700' },

  version: { fontSize: 12, textAlign: 'center', marginTop: 8 },
});
