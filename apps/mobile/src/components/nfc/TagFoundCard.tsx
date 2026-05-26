import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import type { PublicPetProfile } from '@/types';

const { width } = Dimensions.get('window');

interface TagFoundCardProps {
  profile: PublicPetProfile;
  cmacStatus?: 'valid' | 'invalid' | 'not_required' | null;
  onClose: () => void;
}

export function TagFoundCard({ profile, cmacStatus, onClose }: TagFoundCardProps) {
  const { pet, owner, lostReport } = profile;

  const translateY = useSharedValue(60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
    opacity.value = withSpring(1, { damping: 20, stiffness: 200 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleCallOwner = () => {
    Alert.alert(
      'Contact Owner',
      `Call ${owner.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => Linking.openURL(`tel:${owner.phoneMasked.replace(/\s/g, '')}`),
        },
      ],
    );
  };

  return (
    <Animated.View style={[styles.card, animStyle]}>
      {/* Photo + info row */}
      <View style={styles.heroRow}>
        <View style={styles.photoContainer}>
          {pet.photoUrl ? (
            <Image
              source={{ uri: pet.photoUrl }}
              style={styles.petPhoto}
              contentFit="cover"
              transition={400}
            />
          ) : (
            <View style={styles.petPhotoPlaceholder}>
              <Text style={styles.speciesEmoji}>
                {pet.species === 'CAT' ? '🐱' : pet.species === 'BIRD' ? '🐦' : '🐶'}
              </Text>
            </View>
          )}
          {pet.isLost && (
            <View style={styles.lostDot} />
          )}
        </View>

        <View style={styles.petInfoBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.petName} numberOfLines={1}>{pet.name}</Text>
          </View>
          <Text style={styles.petBreed} numberOfLines={1}>
            {pet.breed ?? pet.species}
          </Text>
          {pet.color && (
            <Text style={styles.petColor} numberOfLines={1}>{pet.color}</Text>
          )}

          {/* Status badges */}
          <View style={styles.badgeRow}>
            {pet.isLost && <Badge label="🚨 LOST" variant="danger" size="sm" />}
            {cmacStatus === 'valid' && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>🛡️ Verified</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Lost report alert */}
      {lostReport && (
        <View style={styles.lostBanner}>
          <Text style={styles.lostTitle}>This pet is reported lost</Text>
          {lostReport.lastSeenAddress && (
            <Text style={styles.lostDetail}>Last seen: {lostReport.lastSeenAddress}</Text>
          )}
          {lostReport.reward && (
            <Text style={styles.rewardText}>💰 Reward: ${lostReport.reward}</Text>
          )}
        </View>
      )}

      {/* Owner row */}
      <View style={styles.ownerSection}>
        <View style={styles.ownerAvatar}>
          <Text style={styles.ownerAvatarText}>{owner.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.ownerInfo}>
          <Text style={styles.ownerLabel}>Owner</Text>
          <Text style={styles.ownerName}>{owner.name}</Text>
        </View>
        <Text style={styles.ownerPhone}>{owner.phoneMasked}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.primaryAction]}
          onPress={handleCallOwner}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryActionText}>📞 Contact Owner</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.secondaryAction]}
          onPress={() => {
            onClose();
            router.push(`/lost/${pet.id}` as any);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryActionText}>Full Profile</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 16,
  },

  heroRow: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
    alignItems: 'center',
  },
  photoContainer: { position: 'relative' },
  petPhoto: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: '#2C2C2E',
  },
  petPhotoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: 'rgba(10,132,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speciesEmoji: { fontSize: 36 },
  lostDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF453A',
    borderWidth: 2,
    borderColor: '#1C1C1E',
  },

  petInfoBlock: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  petName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4, flex: 1 },
  petBreed: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  petColor: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  verifiedBadge: {
    backgroundColor: 'rgba(48,209,88,0.12)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(48,209,88,0.25)',
  },
  verifiedText: { fontSize: 11, fontWeight: '600', color: '#30D158' },

  lostBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255,69,58,0.1)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.2)',
    gap: 3,
  },
  lostTitle: { fontSize: 14, fontWeight: '700', color: '#FF453A' },
  lostDetail: { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  rewardText: { fontSize: 13, fontWeight: '600', color: '#30D158' },

  ownerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
  },
  ownerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10,132,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerAvatarText: { fontSize: 18, fontWeight: '700', color: '#0A84FF' },
  ownerInfo: { flex: 1 },
  ownerLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5, textTransform: 'uppercase' },
  ownerName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginTop: 1 },
  ownerPhone: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },

  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAction: {
    backgroundColor: '#0A84FF',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    flex: 1.6,
  },
  primaryActionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryAction: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  secondaryActionText: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '600' },
});
