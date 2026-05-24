import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@hooks/useTheme';
import { usePets } from '@hooks/usePets';
import { PetCard } from '@components/pets/PetCard';
import { Skeleton } from '@components/ui/Skeleton';
import { Button } from '@components/ui/Button';

export default function PetsScreen() {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { data: petsData, isLoading, refetch } = usePets();

  const pets = (petsData?.data ?? []).filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.breed?.toLowerCase().includes(search.toLowerCase())
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Pets</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/pets/add')}
        >
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.surfaceSecondary }]}>
        <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search pets..."
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: colors.textTertiary, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {isLoading ? (
          <View style={{ gap: 12 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} height={90} borderRadius={16} />)}
          </View>
        ) : pets.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 56, marginBottom: 16 }}>🐾</Text>
            {search ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No pets match "{search}"</Text>
            ) : (
              <>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No pets yet</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Add your first pet to get started</Text>
                <Button label="Add a Pet" onPress={() => router.push('/pets/add')} style={{ marginTop: 24, width: 200 }} fullWidth={false} />
              </>
            )}
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {pets.map(pet => (
              <PetCard key={pet.id} pet={pet} onPress={() => router.push(`/pets/${pet.id}` as any)} showActions />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  addText: { color: '#fff', fontSize: 22, fontWeight: '300', marginTop: -1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 16, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 16 },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
