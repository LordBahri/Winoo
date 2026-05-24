import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@hooks/useTheme';
import { Badge } from '@components/ui/Badge';
import type { Pet } from '@types/index';

const SPECIES_EMOJI: Record<string, string> = {
  DOG: '🐶', CAT: '🐱', BIRD: '🐦', RABBIT: '🐰', FISH: '🐟', REPTILE: '🦎', OTHER: '🐾',
};

interface PetCardProps {
  pet: Pet;
  onPress?: () => void;
  showActions?: boolean;
}

export function PetCard({ pet, onPress, showActions }: PetCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Photo */}
      {pet.photoUrl ? (
        <Image source={{ uri: pet.photoUrl }} style={styles.photo} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.photoPlaceholder, { backgroundColor: colors.primary + '15' }]}>
          <Text style={{ fontSize: 28 }}>{SPECIES_EMOJI[pet.species] ?? '🐾'}</Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{pet.name}</Text>
          <View style={styles.badges}>
            {pet.isLost && <Badge label="LOST" variant="danger" size="sm" />}
            {pet.nfcTag ? (
              <Badge label="📡 Tagged" variant="info" size="sm" />
            ) : (
              <Badge label="No Tag" variant="neutral" size="sm" />
            )}
          </View>
        </View>
        <Text style={[styles.breed, { color: colors.textSecondary }]} numberOfLines={1}>
          {pet.breed ?? pet.species} · {pet.gender === 'MALE' ? '♂' : pet.gender === 'FEMALE' ? '♀' : '—'}
          {pet.isNeutered ? ' · Neutered' : ''}
        </Text>
        {pet.dateOfBirth && (
          <Text style={[styles.age, { color: colors.textTertiary }]}>
            {getAge(pet.dateOfBirth)}
          </Text>
        )}
      </View>

      <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
    </TouchableOpacity>
  );
}

function getAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 12) return `${months}mo old`;
  return `${Math.floor(months / 12)}yr old`;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  photo: { width: 64, height: 64, borderRadius: 14 },
  photoPlaceholder: { width: 64, height: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontSize: 17, fontWeight: '700', flex: 1 },
  badges: { flexDirection: 'row', gap: 4 },
  breed: { fontSize: 13 },
  age: { fontSize: 12 },
  chevron: { fontSize: 24, fontWeight: '300', paddingRight: 4 },
});
