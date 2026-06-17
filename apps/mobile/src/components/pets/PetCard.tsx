import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useTheme } from '@hooks/useTheme';
import type { Pet } from '@/types';

const SPECIES_EMOJI: Record<string, string> = {
  DOG: '🐶', CAT: '🐱', BIRD: '🐦', RABBIT: '🐰', FISH: '🐟', REPTILE: '🦎', OTHER: '🐾',
};

const TAG_STATUS_COLORS: Record<string, string> = {
  ASSIGNED: '#30D158',
  PENDING:  '#FF9F0A',
  INACTIVE: '#636366',
};

interface PetCardProps {
  pet: Pet;
  onPress?: () => void;
  showActions?: boolean;
}

function getAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months < 1) return '< 1 mo';
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}yr`;
}

export function PetCard({ pet, onPress }: PetCardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const tagDot = pet.nfcTag
    ? (TAG_STATUS_COLORS[pet.nfcTag.status] ?? '#636366')
    : null;

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.975, { damping: 18, stiffness: 350 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 350 }); }}
        activeOpacity={1}
      >
        {/* Photo */}
        <View style={styles.photoWrapper}>
          {pet.photoUrl ? (
            <Image
              source={{ uri: pet.photoUrl }}
              style={styles.photo}
              contentFit="cover"
              transition={250}
            />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.primary + '18' }]}>
              <Text style={{ fontSize: 26 }}>{SPECIES_EMOJI[pet.species] ?? '🐾'}</Text>
            </View>
          )}
          {pet.isLost && <View style={styles.lostIndicator} />}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.topRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {pet.name}
            </Text>
            {pet.isLost && (
              <View style={styles.lostBadge}>
                <Text style={styles.lostBadgeText}>LOST</Text>
              </View>
            )}
          </View>
          <Text style={[styles.breed, { color: colors.textSecondary }]} numberOfLines={1}>
            {pet.breed ?? pet.species}
            {pet.gender === 'MALE' ? ' · ♂' : pet.gender === 'FEMALE' ? ' · ♀' : ''}
          </Text>
          <View style={styles.metaRow}>
            {pet.dateOfBirth && (
              <Text style={[styles.meta, { color: colors.textTertiary }]}>
                {getAge(pet.dateOfBirth)}
              </Text>
            )}
            {tagDot && (
              <View style={styles.tagStatus}>
                <View style={[styles.tagDot, { backgroundColor: tagDot }]} />
                <Text style={[styles.meta, { color: colors.textTertiary }]}>
                  {pet.nfcTag?.status === 'ASSIGNED' ? 'Tagged' : pet.nfcTag?.status}
                </Text>
              </View>
            )}
            {!pet.nfcTag && (
              <Text style={[styles.meta, { color: colors.textTertiary }]}>No tag</Text>
            )}
          </View>
        </View>

        <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  photoWrapper: { position: 'relative' },
  photo: { width: 68, height: 68, borderRadius: 16 },
  photoPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lostIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF453A',
    borderWidth: 2,
    borderColor: '#fff',
  },

  info: { flex: 1, gap: 3 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 17, fontWeight: '700', flex: 1 },
  lostBadge: {
    backgroundColor: 'rgba(255,69,58,0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  lostBadgeText: { fontSize: 10, fontWeight: '800', color: '#FF453A', letterSpacing: 0.3 },
  breed: { fontSize: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  meta: { fontSize: 12 },
  tagStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagDot: { width: 6, height: 6, borderRadius: 3 },

  chevron: { fontSize: 22, fontWeight: '300', paddingRight: 2 },
});
