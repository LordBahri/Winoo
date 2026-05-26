import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useTheme } from '@hooks/useTheme';
import { usePet, useMarkPetLost, useMarkPetFound } from '@hooks/usePets';
import { Button } from '@components/ui/Button';
import { Skeleton } from '@components/ui/Skeleton';
import { HealthRecordItem } from '@components/pets/HealthRecordItem';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 300;

const SPECIES_EMOJI: Record<string, string> = {
  DOG: '🐶', CAT: '🐱', BIRD: '🐦', RABBIT: '🐰', FISH: '🐟', REPTILE: '🦎', OTHER: '🐾',
};

type Tab = 'info' | 'health' | 'tag';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'info',   label: 'Info',   emoji: '📋' },
  { id: 'health', label: 'Health', emoji: '💉' },
  { id: 'tag',    label: 'Tag',    emoji: '📡' },
];

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.separator }]}>
      <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: pet, isLoading } = usePet(id!);
  const markLost = useMarkPetLost();
  const markFound = useMarkPetFound();
  const [activeTab, setActiveTab] = useState<Tab>('info');

  const tabIndicatorX = useSharedValue(0);
  const TAB_W = (width - 40) / TABS.length;

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorX.value }],
  }));

  const handleTabPress = (tab: Tab, index: number) => {
    setActiveTab(tab);
    tabIndicatorX.value = withTiming(index * TAB_W, { duration: 220 });
  };

  const handleMarkLost = () => {
    Alert.alert(
      'Report as Lost',
      `Report ${pet?.name} as lost? Nearby community members will be alerted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report Lost',
          style: 'destructive',
          onPress: () => markLost.mutate({ petId: id!, description: '' }),
        },
      ],
    );
  };

  const handleMarkFound = () => {
    Alert.alert('Mark as Found', `Mark ${pet?.name} as found? This closes the lost report.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Found', onPress: () => markFound.mutate(id!) },
    ]);
  };

  const handleShare = async () => {
    if (!pet?.nfcTag) return;
    await Share.share({
      message: `Find ${pet.name}'s profile: https://petid.app/t/${pet.nfcTag.publicId ?? pet.nfcTag.uid}`,
      url: `https://petid.app/t/${pet.nfcTag.publicId ?? pet.nfcTag.uid}`,
      title: `${pet.name}'s PetID Profile`,
    });
  };

  if (isLoading || !pet) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Skeleton height={HERO_HEIGHT} borderRadius={0} />
        <View style={{ padding: 20, gap: 12 }}>
          <Skeleton height={34} width="55%" />
          <Skeleton height={18} width="35%" />
          <Skeleton height={18} width="70%" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: pet.name,
          headerTransparent: true,
          headerBackTitle: 'Pets',
          headerTintColor: '#fff',
        }}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          {pet.photoUrl ? (
            <Image source={{ uri: pet.photoUrl }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: colors.primary + '25' }]}>
              <Text style={styles.heroEmoji}>{SPECIES_EMOJI[pet.species] ?? '🐾'}</Text>
            </View>
          )}
          {/* Top dark overlay for header legibility */}
          <View style={styles.heroGradientTop} />

          {/* Lost banner */}
          {pet.isLost && (
            <View style={styles.lostBanner}>
              <View style={styles.lostDot} />
              <Text style={styles.lostBannerText}>LOST</Text>
            </View>
          )}

          {/* Action buttons overlay */}
          <View style={styles.heroActions}>
            {pet.nfcTag && (
              <TouchableOpacity
                style={styles.heroActionBtn}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <Text style={styles.heroActionEmoji}>🔗</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.heroActionBtn}
              onPress={() => router.push(`/pets/${id}/edit` as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.heroActionEmoji}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Name section */}
        <Animated.View
          entering={FadeInDown.delay(0).duration(350)}
          style={[styles.nameSection, { backgroundColor: colors.background }]}
        >
          <Text style={[styles.petName, { color: colors.text }]}>{pet.name}</Text>
          <Text style={[styles.petMeta, { color: colors.textSecondary }]}>
            {pet.breed ?? pet.species}
            {pet.gender === 'MALE' ? ' · ♂' : pet.gender === 'FEMALE' ? ' · ♀' : ''}
            {pet.dateOfBirth ? ` · ${getAge(pet.dateOfBirth)} old` : ''}
          </Text>
        </Animated.View>

        {/* Tab bar */}
        <Animated.View entering={FadeInDown.delay(60).duration(350)}>
          <View style={[styles.tabBar, { borderBottomColor: colors.separator }]}>
            {TABS.map((tab, i) => (
              <TouchableOpacity
                key={tab.id}
                style={styles.tab}
                onPress={() => handleTabPress(tab.id, i)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === tab.id ? colors.primary : colors.textSecondary },
                    activeTab === tab.id && styles.tabTextActive,
                  ]}
                >
                  {tab.emoji} {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Sliding indicator */}
          <View style={{ height: 2, backgroundColor: 'transparent', overflow: 'hidden', position: 'relative' }}>
            <Animated.View
              style={[
                styles.tabIndicator,
                { backgroundColor: colors.primary, width: TAB_W },
                indicatorStyle,
              ]}
            />
          </View>
        </Animated.View>

        {/* Tab content */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(350)}
          style={styles.tabContent}
        >
          {activeTab === 'info' && (
            <View style={{ gap: 16 }}>
              <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                <InfoRow label="Species"     value={pet.species} />
                <InfoRow label="Gender"      value={pet.gender} />
                <InfoRow label="Date of Birth" value={pet.dateOfBirth ? new Date(pet.dateOfBirth).toLocaleDateString() : '—'} />
                <InfoRow label="Color"       value={pet.color ?? '—'} />
                <InfoRow label="Weight"      value={pet.weight ? `${pet.weight} kg` : '—'} />
                <InfoRow label="Neutered"    value={pet.isNeutered ? 'Yes' : 'No'} />
                <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                  <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Microchip</Text>
                  <Text style={[styles.infoValue, { color: pet.microchipId ? colors.text : colors.textTertiary, fontFamily: pet.microchipId ? 'Courier' : undefined }]}>
                    {pet.microchipId ?? 'Not registered'}
                  </Text>
                </View>
              </View>

              {pet.isLost ? (
                <Button
                  label="✅ Mark as Found"
                  onPress={handleMarkFound}
                  variant="secondary"
                  loading={markFound.isPending}
                />
              ) : (
                <Button
                  label="🚨 Report as Lost"
                  onPress={handleMarkLost}
                  variant="danger"
                  loading={markLost.isPending}
                />
              )}
            </View>
          )}

          {activeTab === 'health' && (
            <View style={{ gap: 10 }}>
              {pet.healthRecords && pet.healthRecords.length > 0 ? (
                [...pet.healthRecords]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(record => <HealthRecordItem key={record.id} record={record} />)
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>💉</Text>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No health records</Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                    Add vaccinations, vet visits, and medications
                  </Text>
                </View>
              )}
              <Button label="+ Add Health Record" onPress={() => {}} variant="secondary" />
            </View>
          )}

          {activeTab === 'tag' && (
            <View style={{ gap: 12 }}>
              {pet.nfcTag ? (
                <>
                  <View style={[styles.tagCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.tagHeader}>
                      <View style={[styles.tagIconWrap, { backgroundColor: colors.primary + '18' }]}>
                        <Text style={{ fontSize: 28 }}>📡</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.tagUid, { color: colors.text }]}>
                          {pet.nfcTag.uid}
                        </Text>
                        <Text style={[styles.tagModel, { color: colors.textSecondary }]}>
                          {pet.nfcTag.type ?? 'NFC Tag'}
                        </Text>
                      </View>
                      <View style={[
                        styles.tagStatusPill,
                        { backgroundColor: (pet.nfcTag.status === 'ASSIGNED' ? '#30D158' : '#FF9F0A') + '20' },
                      ]}>
                        <View style={[
                          styles.tagStatusDot,
                          { backgroundColor: pet.nfcTag.status === 'ASSIGNED' ? '#30D158' : '#FF9F0A' },
                        ]} />
                        <Text style={[
                          styles.tagStatusText,
                          { color: pet.nfcTag.status === 'ASSIGNED' ? '#30D158' : '#FF9F0A' },
                        ]}>
                          {pet.nfcTag.status}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.tagDivider, { backgroundColor: colors.separator }]} />

                    <View style={styles.tagUrlRow}>
                      <Text style={[styles.tagUrlLabel, { color: colors.textTertiary }]}>Public URL</Text>
                      <Text style={[styles.tagUrl, { color: colors.primary }]} numberOfLines={1}>
                        petid.app/t/{pet.nfcTag.publicId ?? pet.nfcTag.uid}
                      </Text>
                    </View>
                  </View>

                  <Button label="🔗 Share Tag Profile" onPress={handleShare} variant="secondary" />
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🏷️</Text>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No NFC tag linked</Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                    Scan an NFC tag to link it to {pet.name}
                  </Text>
                  <Button
                    label="📡 Scan & Link Tag"
                    onPress={() => router.push('/scan')}
                    style={{ marginTop: 16 }}
                    fullWidth={false}
                  />
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  hero: { position: 'relative', height: HERO_HEIGHT },
  heroImage: { width: '100%', height: HERO_HEIGHT },
  heroPlaceholder: {
    width: '100%',
    height: HERO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 90 },
  heroGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  lostBanner: {
    position: 'absolute',
    top: 60,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF453A',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  lostDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  lostBannerText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  heroActions: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    flexDirection: 'row',
    gap: 8,
  },
  heroActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroActionEmoji: { fontSize: 17 },

  nameSection: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 },
  petName: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8, marginBottom: 4 },
  petMeta: { fontSize: 15 },

  tabBar: {
    flexDirection: 'row',
    marginTop: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '500' },
  tabTextActive: { fontWeight: '700' },
  tabIndicator: { position: 'absolute', bottom: 0, height: 2, borderRadius: 1 },

  tabContent: { padding: 20, paddingTop: 16 },

  infoCard: { borderRadius: 18, overflow: 'hidden' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '600' },

  tagCard: { borderRadius: 18, overflow: 'hidden', padding: 16 },
  tagHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tagIconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tagUid: { fontSize: 14, fontWeight: '700', fontFamily: 'Courier', marginBottom: 2 },
  tagModel: { fontSize: 12 },
  tagStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagStatusDot: { width: 6, height: 6, borderRadius: 3 },
  tagStatusText: { fontSize: 12, fontWeight: '700' },
  tagDivider: { height: 1, marginVertical: 14 },
  tagUrlRow: { gap: 4 },
  tagUrlLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  tagUrl: { fontSize: 14, fontWeight: '500' },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  emptyEmoji: { fontSize: 48, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
