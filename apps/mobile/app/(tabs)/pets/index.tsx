import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
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
import { useTheme } from '@hooks/useTheme';
import { usePets } from '@hooks/usePets';
import { PetCard } from '@components/pets/PetCard';
import { Skeleton } from '@components/ui/Skeleton';
import type { Pet } from '@/types';

const { width } = Dimensions.get('window');

type Filter = 'all' | 'lost' | 'tagged' | 'untagged';

const FILTERS: { id: Filter; label: string; emoji: string }[] = [
  { id: 'all',      label: 'All',      emoji: '🐾' },
  { id: 'lost',     label: 'Lost',     emoji: '🚨' },
  { id: 'tagged',   label: 'Tagged',   emoji: '📡' },
  { id: 'untagged', label: 'No Tag',   emoji: '🏷️' },
];

function FilterChip({
  item,
  active,
  onPress,
  count,
}: {
  item: (typeof FILTERS)[0];
  active: boolean;
  onPress: () => void;
  count: number;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[
          styles.filterChip,
          { backgroundColor: active ? colors.primary : colors.surface },
          active && styles.filterChipActive,
        ]}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.92, { damping: 15, stiffness: 350 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 350 }); }}
        activeOpacity={1}
      >
        <Text style={styles.filterEmoji}>{item.emoji}</Text>
        <Text style={[styles.filterLabel, { color: active ? '#fff' : colors.textSecondary }]}>
          {item.label}
        </Text>
        {count > 0 && (
          <View style={[styles.filterCount, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : colors.surfaceSecondary }]}>
            <Text style={[styles.filterCountText, { color: active ? '#fff' : colors.textTertiary }]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PetsScreen() {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { data: petsData, isLoading, refetch } = usePets();

  const allPets = petsData?.data ?? [];

  const counts: Record<Filter, number> = {
    all:      allPets.length,
    lost:     (allPets as Pet[]).filter((p: Pet) => p.isLost).length,
    tagged:   (allPets as Pet[]).filter((p: Pet) => !!p.nfcTag).length,
    untagged: (allPets as Pet[]).filter((p: Pet) => !p.nfcTag).length,
  };

  const filtered = (allPets as Pet[])
    .filter((p: Pet) => {
      if (filter === 'lost') return p.isLost;
      if (filter === 'tagged') return !!p.nfcTag;
      if (filter === 'untagged') return !p.nfcTag;
      return true;
    })
    .filter((p: Pet) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.breed?.toLowerCase().includes(search.toLowerCase()),
    );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>My Pets</Text>
          {allPets.length > 0 && (
            <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
              {allPets.length} pet{allPets.length !== 1 ? 's' : ''} registered
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/pets/add')}
          activeOpacity={0.8}
        >
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by name or breed…"
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: colors.textTertiary, fontSize: 15 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      {allPets.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
          style={styles.filtersScroll}
        >
          {FILTERS.map(f => (
            <FilterChip
              key={f.id}
              item={f}
              active={filter === f.id}
              count={counts[f.id]}
              onPress={() => setFilter(f.id)}
            />
          ))}
        </ScrollView>
      )}

      {/* List */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {isLoading ? (
          <View style={{ gap: 10 }}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} height={88} borderRadius={18} />)}
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>
              {search ? '🔍' : filter === 'lost' ? '🎉' : '🐾'}
            </Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {search
                ? `No results for "${search}"`
                : filter === 'lost'
                ? 'No lost pets!'
                : filter === 'tagged'
                ? 'No tagged pets yet'
                : filter === 'untagged'
                ? 'All pets have tags'
                : 'No pets yet'}
            </Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              {search
                ? 'Try a different name or breed'
                : filter === 'lost'
                ? 'All your pets are safe and accounted for'
                : filter !== 'all'
                ? 'Change the filter to see more pets'
                : 'Add your first pet to get started with NFC protection'}
            </Text>
            {!search && filter === 'all' && (
              <TouchableOpacity
                style={[styles.emptyAction, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/pets/add')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyActionText}>Add a Pet</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {filtered.map((pet: Pet, i: number) => (
              <Animated.View
                key={pet.id}
                entering={FadeInDown.delay(i * 40).duration(350).springify()}
              >
                <PetCard
                  pet={pet}
                  onPress={() => router.push(`/pets/${pet.id}` as any)}
                />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { fontSize: 13, marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addText: { color: '#fff', fontSize: 24, fontWeight: '300', lineHeight: 28 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16 },

  filtersScroll: { marginBottom: 12 },
  filtersRow: { paddingHorizontal: 20, gap: 8, paddingRight: 20 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  filterChipActive: {
    shadowColor: '#0A84FF',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  filterEmoji: { fontSize: 14 },
  filterLabel: { fontSize: 13, fontWeight: '600' },
  filterCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountText: { fontSize: 11, fontWeight: '700' },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  empty: { alignItems: 'center', paddingTop: 72, gap: 6 },
  emptyEmoji: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 260, marginTop: 4 },
  emptyAction: {
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyActionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
