import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useEffect,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTheme } from '@hooks/useTheme';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import type { PublicPetProfile } from '@types/index';

interface TagFoundCardProps {
  profile: PublicPetProfile;
  onClose: () => void;
}

export function TagFoundCard({ profile, onClose }: TagFoundCardProps) {
  const { colors } = useTheme();
  const { pet, owner, lostReport } = profile;

  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 16, stiffness: 180 });
    opacity.value = withSpring(1);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleCallOwner = () => {
    Alert.alert(
      'Contact Owner',
      `Call ${owner.name}?\n${owner.phoneMasked}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${owner.phoneMasked.replace(/\s/g, '')}`) },
      ],
    );
  };

  return (
    <Animated.View style={[styles.card, { backgroundColor: colors.surface }, animStyle]}>
      {/* Pet photo */}
      <View style={styles.photoRow}>
        {pet.photoUrl ? (
          <Image
            source={{ uri: pet.photoUrl }}
            style={styles.petPhoto}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[styles.petPhotoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
            <Text style={{ fontSize: 40 }}>{pet.species === 'CAT' ? '🐱' : '🐶'}</Text>
          </View>
        )}
        <View style={styles.petInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.petName, { color: colors.text }]}>{pet.name}</Text>
            {pet.isLost && <Badge label="LOST" variant="danger" size="sm" />}
          </View>
          <Text style={[styles.petBreed, { color: colors.textSecondary }]}>
            {pet.breed ?? pet.species}
          </Text>
          {pet.color && (
            <Text style={[styles.petColor, { color: colors.textTertiary }]}>
              {pet.color}
            </Text>
          )}
        </View>
      </View>

      {/* Lost report info */}
      {lostReport && (
        <View style={[styles.lostBanner, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '30' }]}>
          <Text style={[styles.lostTitle, { color: colors.danger }]}>🚨 This pet is lost!</Text>
          {lostReport.lastSeenAddress && (
            <Text style={[styles.lostAddress, { color: colors.textSecondary }]}>
              Last seen: {lostReport.lastSeenAddress}
            </Text>
          )}
          {lostReport.reward && (
            <Text style={[styles.reward, { color: colors.success }]}>
              💰 Reward: ${lostReport.reward}
            </Text>
          )}
        </View>
      )}

      {/* Owner info */}
      <View style={[styles.ownerRow, { borderTopColor: colors.separator }]}>
        <Text style={[styles.ownerLabel, { color: colors.textTertiary }]}>Owner</Text>
        <Text style={[styles.ownerName, { color: colors.text }]}>{owner.name}</Text>
        <Text style={[styles.ownerPhone, { color: colors.textSecondary }]}>{owner.phoneMasked}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          label="📞 Contact Owner"
          onPress={handleCallOwner}
          style={{ flex: 1 }}
        />
        <TouchableOpacity
          style={[styles.viewBtn, { backgroundColor: colors.surfaceSecondary }]}
          onPress={() => {
            onClose();
            router.push(`/lost/${pet.id}` as any);
          }}
        >
          <Text style={[styles.viewBtnText, { color: colors.text }]}>Full Profile</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 20, margin: 16, overflow: 'hidden' },
  photoRow: { flexDirection: 'row', gap: 14, marginBottom: 16, alignItems: 'center' },
  petPhoto: { width: 80, height: 80, borderRadius: 20 },
  petPhotoPlaceholder: { width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  petInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  petName: { fontSize: 22, fontWeight: '700' },
  petBreed: { fontSize: 15 },
  petColor: { fontSize: 13 },
  lostBanner: { borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, gap: 4 },
  lostTitle: { fontSize: 15, fontWeight: '700' },
  lostAddress: { fontSize: 13 },
  reward: { fontSize: 13, fontWeight: '600' },
  ownerRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, marginBottom: 16 },
  ownerLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  ownerName: { fontSize: 17, fontWeight: '600', marginBottom: 2 },
  ownerPhone: { fontSize: 15 },
  actions: { flexDirection: 'row', gap: 10 },
  viewBtn: { borderRadius: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', height: 52 },
  viewBtnText: { fontSize: 15, fontWeight: '600' },
});
