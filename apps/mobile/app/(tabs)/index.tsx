import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@stores/auth.store';
import { usePets } from '@hooks/usePets';
import { useNotifications } from '@hooks/useNotifications';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Avatar } from '@components/ui/Avatar';
import { Skeleton } from '@components/ui/Skeleton';
import { PetCard } from '@components/pets/PetCard';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { data: petsData, isLoading: petsLoading, refetch } = usePets();
  const { unreadCount } = useNotifications();
  const [refreshing, setRefreshing] = React.useState(false);

  const pets = petsData?.data ?? [];
  const lostPets = pets.filter(p => p.isLost);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting()}</Text>
            <Text style={[styles.name, { color: colors.text }]}>{user?.name?.split(' ')[0] ?? 'Pet Parent'} 👋</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/notifications')}>
            <View style={[styles.notifBadge, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 22 }}>🔔</Text>
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Lost pet alert */}
        {lostPets.length > 0 && (
          <Card
            style={[styles.alertCard, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '30' }]}
            variant="outlined"
          >
            <Text style={styles.alertEmoji}>🚨</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: colors.danger }]}>
                {lostPets.length} pet{lostPets.length > 1 ? 's' : ''} reported lost
              </Text>
              <Text style={[styles.alertSub, { color: colors.textSecondary }]}>
                Tap to view and manage lost reports
              </Text>
            </View>
          </Card>
        )}

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map(action => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 28, marginBottom: 8 }}>{action.emoji}</Text>
                <Text style={[styles.actionLabel, { color: colors.text }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* My pets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>My Pets</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/pets')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {petsLoading ? (
            <View style={{ gap: 12 }}>
              <Skeleton height={90} borderRadius={16} />
              <Skeleton height={90} borderRadius={16} />
            </View>
          ) : pets.length === 0 ? (
            <TouchableOpacity
              style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderLight, borderStyle: 'dashed' }]}
              onPress={() => router.push('/pets/add')}
            >
              <Text style={{ fontSize: 40, marginBottom: 8 }}>🐾</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Add your first pet</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Tap to register a pet and link an NFC tag
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ gap: 12 }}>
              {pets.slice(0, 3).map(pet => (
                <PetCard key={pet.id} pet={pet} onPress={() => router.push(`/pets/${pet.id}` as any)} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const QUICK_ACTIONS = [
  { id: 'scan', emoji: '📡', label: 'Scan Tag', route: '/scan' },
  { id: 'add', emoji: '➕', label: 'Add Pet', route: '/pets/add' },
  { id: 'lost', emoji: '🔍', label: 'Lost Pets', route: '/(tabs)/map' },
  { id: 'health', emoji: '💉', label: 'Vaccinations', route: '/(tabs)/pets' },
];

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, fontWeight: '500' },
  name: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  notifBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, marginBottom: 24 },
  alertEmoji: { fontSize: 28 },
  alertTitle: { fontSize: 15, fontWeight: '700' },
  alertSub: { fontSize: 13, marginTop: 2 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  seeAll: { fontSize: 15, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '47%', borderRadius: 16, padding: 16, alignItems: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  actionLabel: { fontSize: 14, fontWeight: '600' },
  emptyCard: { borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 2 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
