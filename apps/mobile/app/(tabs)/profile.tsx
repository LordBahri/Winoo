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
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@stores/auth.store';
import { Avatar } from '@components/ui/Avatar';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';

interface SettingItem {
  emoji: string;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const settings: SettingItem[] = [
    { emoji: '👤', label: 'Edit Profile', onPress: () => {} },
    { emoji: '🔔', label: 'Notifications', onPress: () => {} },
    { emoji: '🔒', label: 'Change Password', onPress: () => {} },
    { emoji: '📱', label: 'NFC Tag Manager', onPress: () => {} },
    { emoji: '💳', label: 'Subscription', value: user?.subscription?.plan ?? 'FREE', onPress: () => {} },
    { emoji: '❓', label: 'Help & Support', onPress: () => {} },
    { emoji: '📋', label: 'Privacy Policy', onPress: () => {} },
    { emoji: '🚪', label: 'Sign Out', onPress: handleLogout, danger: true },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Profile</Text>

        <Card style={styles.profileCard}>
          <Avatar name={user?.name} uri={user?.avatarUrl} size={72} />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{user?.name}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
            <View style={styles.badges}>
              <Badge
                label={user?.subscription?.plan ?? 'FREE'}
                variant={user?.subscription?.plan === 'PRO' ? 'info' : 'neutral'}
                size="sm"
              />
              {user?.isEmailVerified && (
                <Badge label="Verified" variant="success" size="sm" />
              )}
            </View>
          </View>
        </Card>

        <View style={styles.settingsList}>
          {settings.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.separator }]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 20, marginRight: 14 }}>{item.emoji}</Text>
              <Text style={[styles.settingLabel, { color: item.danger ? colors.danger : colors.text }]}>
                {item.label}
              </Text>
              {item.value && (
                <Badge label={item.value} variant="neutral" size="sm" style={{ marginRight: 8 }} />
              )}
              {!item.danger && (
                <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.version, { color: colors.textTertiary }]}>PetID v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  pageTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginBottom: 20, marginTop: 8 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  profileEmail: { fontSize: 14, marginBottom: 8 },
  badges: { flexDirection: 'row', gap: 6 },
  settingsList: { borderRadius: 16, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  settingLabel: { flex: 1, fontSize: 16, fontWeight: '500' },
  chevron: { fontSize: 22, fontWeight: '300' },
  version: { fontSize: 12, textAlign: 'center', marginTop: 32 },
});
