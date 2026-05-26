import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@stores/auth.store';
import { usePets } from '@hooks/usePets';
import { useNotifications } from '@hooks/useNotifications';
import { Skeleton } from '@components/ui/Skeleton';
import { PetCard } from '@components/pets/PetCard';
import type { Pet } from '@/types';

const { width } = Dimensions.get('window');

const SPECIES_EMOJI: Record<string, string> = {
  DOG: '🐶', CAT: '🐱', BIRD: '🐦', RABBIT: '🐰', FISH: '🐟', REPTILE: '🦎', OTHER: '🐾',
};

function PetAvatarChip({
  pet,
  onPress,
  delay,
}: {
  pet: any;
  onPress: () => void;
  delay: number;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const ringColor = pet.isLost ? '#FF453A' : pet.nfcTag ? '#30D158' : colors.border;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        onPressIn={() => { scale.value = withSpring(0.93, { damping: 16, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 16, stiffness: 300 }); }}
      >
        <Animated.View style={animStyle}>
          <View style={[styles.avatarRing, { borderColor: ringColor }]}>
            {pet.photoUrl ? (
              <Image source={{ uri: pet.photoUrl }} style={styles.avatarImg} contentFit="cover" transition={300} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                <Text style={{ fontSize: 22 }}>{SPECIES_EMOJI[pet.species] ?? '🐾'}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.avatarName, { color: colors.text }]} numberOfLines={1}>
            {pet.name}
          </Text>
          {pet.isLost && (
            <View style={styles.lostChip}>
              <Text style={styles.lostChipText}>LOST</Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function QuickActionCard({
  emoji,
  label,
  color,
  onPress,
  delay,
}: {
  emoji: string;
  label: string;
  color: string;
  onPress: () => void;
  delay: number;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[styles.actionCardOuter, animStyle]}
      entering={FadeInDown.delay(delay).duration(350).springify()}
    >
      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: colors.surface }]}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.94, { damping: 16, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 16, stiffness: 300 }); }}
        activeOpacity={1}
      >
        <View style={[styles.actionIconBg, { backgroundColor: color + '18' }]}>
          <Text style={{ fontSize: 22 }}>{emoji}</Text>
        </View>
        <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const QUICK_ACTIONS = [
  { id: 'scan',   emoji: '📡', label: 'Scan Tag',    color: '#0A84FF', route: '/scan' },
  { id: 'add',    emoji: '➕', label: 'Add Pet',     color: '#30D158', route: '/pets/add' },
  { id: 'map',    emoji: '🗺️', label: 'Lost Map',    color: '#FF9F0A', route: '/(tabs)/map' },
  { id: 'health', emoji: '💉', label: 'Health',      color: '#FF453A', route: '/(tabs)/pets' },
];

function greeting(name?: string) {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${greet}${name ? `, ${name}` : ''} 👋`;
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const { data: petsData, isLoading: petsLoading, refetch } = usePets();
  const { unreadCount } = useNotifications();
  const [refreshing, setRefreshing] = React.useState(false);

  const pets = petsData?.data ?? [];
  const lostPets = (pets as Pet[]).filter((p: Pet) => p.isLost);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
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
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {greeting(user?.name?.split(' ')[0])}
            </Text>
            <Text style={[styles.tagline, { color: colors.text }]}>
              {lostPets.length > 0
                ? `${lostPets.length} pet${lostPets.length > 1 ? 's' : ''} need${lostPets.length === 1 ? 's' : ''} attention`
                : pets.length > 0
                ? `${pets.length} pet${pets.length > 1 ? 's' : ''} protected`
                : 'Welcome to PetID'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={[styles.notifBtn, { backgroundColor: colors.surface }]}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 }}>🔔</Text>
            {unreadCount > 0 && (
              <View style={[styles.notifBadge, { backgroundColor: colors.danger }]}>
                <Text style={styles.notifBadgeText}>
                  {unreadCount > 9 ? '9+' : String(unreadCount)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Lost pet alert */}
        {lostPets.length > 0 && (
          <Animated.View entering={FadeInDown.delay(80).duration(400)}>
            <TouchableOpacity
              style={[styles.lostAlert, { borderColor: colors.danger + '35' }]}
              activeOpacity={0.8}
            >
              <View style={styles.lostAlertLeft}>
                <View style={styles.lostAlertDot} />
                <View>
                  <Text style={styles.lostAlertTitle}>
                    {lostPets.map(p => p.name).join(', ')} {lostPets.length === 1 ? 'is' : 'are'} reported lost
                  </Text>
                  <Text style={styles.lostAlertSub}>Tap to view and manage alerts</Text>
                </View>
              </View>
              <Text style={styles.lostAlertChevron}>›</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Pet avatars */}
        {(pets.length > 0 || petsLoading) && (
          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Pets</Text>
            {petsLoading ? (
              <View style={styles.avatarRow}>
                {[1, 2, 3].map(i => (
                  <View key={i} style={styles.avatarSkeleton}>
                    <Skeleton width={72} height={72} borderRadius={36} />
                    <Skeleton width={50} height={10} borderRadius={5} style={{ marginTop: 8 }} />
                  </View>
                ))}
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.avatarRow}
              >
                {(pets as Pet[]).map((pet: Pet, i: number) => (
                  <PetAvatarChip
                    key={pet.id}
                    pet={pet}
                    onPress={() => router.push(`/pets/${pet.id}` as any)}
                    delay={i * 60}
                  />
                ))}
                <Animated.View entering={FadeInDown.delay(pets.length * 60).duration(400)}>
                  <TouchableOpacity
                    style={[styles.addAvatarBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                    onPress={() => router.push('/pets/add')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.addAvatarIcon, { color: colors.primary }]}>+</Text>
                  </TouchableOpacity>
                  <Text style={[styles.avatarName, { color: colors.textTertiary }]}>Add</Text>
                </Animated.View>
              </ScrollView>
            )}
          </Animated.View>
        )}

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action, i) => (
              <QuickActionCard
                key={action.id}
                emoji={action.emoji}
                label={action.label}
                color={action.color}
                onPress={() => router.push(action.route as any)}
                delay={280 + i * 50}
              />
            ))}
          </View>
        </Animated.View>

        {/* My pets list */}
        <Animated.View entering={FadeInDown.delay(360).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
            {pets.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/pets' as any)}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            )}
          </View>

          {petsLoading ? (
            <View style={{ gap: 12 }}>
              <Skeleton height={88} borderRadius={16} />
              <Skeleton height={88} borderRadius={16} />
            </View>
          ) : pets.length === 0 ? (
            <TouchableOpacity
              style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={() => router.push('/pets/add')}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 44, marginBottom: 12 }}>🐾</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Add your first pet</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Register a pet and link an NFC tag — takes 60 seconds
              </Text>
              <View style={[styles.emptyAction, { backgroundColor: colors.primary + '18' }]}>
                <Text style={[styles.emptyActionText, { color: colors.primary }]}>Get started →</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={{ gap: 10 }}>
              {(pets as Pet[]).slice(0, 4).map((pet: Pet) => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  onPress={() => router.push(`/pets/${pet.id}` as any)}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  tagline: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: 12,
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  lostAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,69,58,0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  lostAlertLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  lostAlertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF453A' },
  lostAlertTitle: { fontSize: 14, fontWeight: '700', color: '#FF453A', marginBottom: 2 },
  lostAlertSub: { fontSize: 12, color: 'rgba(255,69,58,0.7)' },
  lostAlertChevron: { fontSize: 22, color: '#FF453A', fontWeight: '300' },

  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, marginBottom: 14 },
  seeAll: { fontSize: 15, fontWeight: '600' },

  avatarRow: { gap: 18, paddingBottom: 4, paddingRight: 4 },
  avatarSkeleton: { alignItems: 'center', gap: 8, width: 72 },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    padding: 2,
    marginBottom: 6,
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 33 },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarName: { fontSize: 11, fontWeight: '600', textAlign: 'center', width: 72 },
  lostChip: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF453A',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  lostChipText: { fontSize: 8, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  addAvatarBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  addAvatarIcon: { fontSize: 28, fontWeight: '300', lineHeight: 36 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCardOuter: { width: (width - 40 - 12) / 2 },
  actionCard: {
    borderRadius: 18,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },

  emptyCard: {
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 4,
  },
  emptyTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 240 },
  emptyAction: { marginTop: 16, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  emptyActionText: { fontSize: 15, fontWeight: '700' },
});
