import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useTheme } from '@hooks/useTheme';
import { usePet, useMarkPetLost, useMarkPetFound } from '@hooks/usePets';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { Skeleton } from '@components/ui/Skeleton';
import { HealthRecordItem } from '@components/pets/HealthRecordItem';

const SPECIES_EMOJI: Record<string, string> = {
  DOG: '🐶', CAT: '🐱', BIRD: '🐦', RABBIT: '🐰', FISH: '🐟', REPTILE: '🦎', OTHER: '🐾',
};

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: pet, isLoading } = usePet(id!);
  const markLost = useMarkPetLost();
  const markFound = useMarkPetFound();
  const [activeTab, setActiveTab] = useState<'info' | 'health' | 'tag'>('info');

  const handleMarkLost = () => {
    Alert.alert(
      'Report as Lost',
      `Report ${pet?.name} as lost? This will alert nearby community members.`,
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
    Alert.alert(
      'Mark as Found',
      `Mark ${pet?.name} as found? This will close the lost report.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Found',
          onPress: () => markFound.mutate(id!),
        },
      ],
    );
  };

  const handleShare = async () => {
    if (!pet?.nfcTag) return;
    await Share.share({
      message: `Find ${pet.name}'s profile: https://petid.app/scan/${pet.nfcTag.uid}`,
      url: `https://petid.app/scan/${pet.nfcTag.uid}`,
      title: `${pet.name}'s PetID Profile`,
    });
  };

  if (isLoading || !pet) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.skeletonContainer}>
          <Skeleton height={280} borderRadius={0} />
          <View style={{ padding: 20, gap: 12 }}>
            <Skeleton height={32} width="60%" />
            <Skeleton height={20} width="40%" />
            <Skeleton height={20} width="80%" />
          </View>
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
            <View style={[styles.heroPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <Text style={{ fontSize: 80 }}>{SPECIES_EMOJI[pet.species] ?? '🐾'}</Text>
            </View>
          )}
          <View style={styles.heroOverlay} />
          {pet.isLost && (
            <View style={styles.lostBanner}>
              <Badge label="🚨 LOST" variant="danger" />
            </View>
          )}
        </View>

        {/* Name & quick actions */}
        <View style={[styles.nameSection, { backgroundColor: colors.background }]}>
          <View>
            <Text style={[styles.petName, { color: colors.text }]}>{pet.name}</Text>
            <Text style={[styles.petBreed, { color: colors.textSecondary }]}>
              {pet.breed ?? pet.species} · {pet.gender}
            </Text>
          </View>
          <View style={styles.quickActions}>
            {pet.nfcTag && (
              <TouchableOpacity style={[styles.actionIcon, { backgroundColor: colors.surfaceSecondary }]} onPress={handleShare}>
                <Text style={{ fontSize: 20 }}>🔗</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionIcon, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => router.push(`/pets/${id}/edit` as any)}
            >
              <Text style={{ fontSize: 20 }}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { borderBottomColor: colors.separator }]}>
          {(['info', 'health', 'tag'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.textSecondary }]}>
                {tab === 'info' ? '📋 Info' : tab === 'health' ? '💉 Health' : '📡 Tag'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'info' && (
            <View style={{ gap: 12 }}>
              <Card>
                {[
                  ['Species', pet.species],
                  ['Gender', pet.gender],
                  ['Date of Birth', pet.dateOfBirth ? new Date(pet.dateOfBirth).toLocaleDateString() : '—'],
                  ['Color', pet.color ?? '—'],
                  ['Weight', pet.weight ? `${pet.weight} kg` : '—'],
                  ['Neutered', pet.isNeutered ? 'Yes' : 'No'],
                  ['Microchip', pet.microchipId ?? '—'],
                ].map(([label, value]) => (
                  <View key={label} style={[styles.infoRow, { borderBottomColor: colors.separator }]}>
                    <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{label}</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
                  </View>
                ))}
              </Card>

              <View style={{ gap: 10 }}>
                {pet.isLost ? (
                  <Button label="✅ Mark as Found" onPress={handleMarkFound} variant="secondary" loading={markFound.isPending} />
                ) : (
                  <Button label="🚨 Report as Lost" onPress={handleMarkLost} variant="danger" loading={markLost.isPending} />
                )}
              </View>
            </View>
          )}

          {activeTab === 'health' && (
            <View style={{ gap: 10 }}>
              {pet.healthRecords && pet.healthRecords.length > 0 ? (
                pet.healthRecords
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(record => <HealthRecordItem key={record.id} record={record} />)
              ) : (
                <View style={styles.emptyHealth}>
                  <Text style={{ fontSize: 40, marginBottom: 12 }}>💉</Text>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No health records</Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                    Add vaccinations, checkups, and more
                  </Text>
                </View>
              )}
              <Button label="+ Add Health Record" onPress={() => {}} variant="secondary" />
            </View>
          )}

          {activeTab === 'tag' && (
            <View style={{ gap: 12 }}>
              {pet.nfcTag ? (
                <Card>
                  <View style={styles.tagRow}>
                    <Text style={{ fontSize: 32, marginRight: 12 }}>📡</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tagUid, { color: colors.text }]}>
                        {pet.nfcTag.uid}
                      </Text>
                      <Text style={[styles.tagType, { color: colors.textSecondary }]}>
                        {pet.nfcTag.type}
                      </Text>
                    </View>
                    <Badge
                      label={pet.nfcTag.status}
                      variant={pet.nfcTag.status === 'ASSIGNED' ? 'success' : 'warning'}
                      size="sm"
                    />
                  </View>
                  <View style={[styles.tagDivider, { backgroundColor: colors.separator }]} />
                  <Text style={[styles.tagPublicUrl, { color: colors.textSecondary }]}>
                    Public URL:{'\n'}
                    <Text style={{ color: colors.primary }}>
                      https://petid.app/scan/{pet.nfcTag.uid}
                    </Text>
                  </Text>
                </Card>
              ) : (
                <View style={styles.emptyTag}>
                  <Text style={{ fontSize: 40, marginBottom: 12 }}>🏷️</Text>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No NFC tag linked</Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                    Scan an NFC tag to link it to this pet
                  </Text>
                  <Button label="📡 Scan & Link Tag" onPress={() => router.push('/scan')} style={{ marginTop: 20 }} fullWidth={false} />
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  skeletonContainer: { flex: 1 },
  hero: { position: 'relative', height: 280 },
  heroImage: { width: '100%', height: 280 },
  heroPlaceholder: { width: '100%', height: 280, alignItems: 'center', justifyContent: 'center' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  lostBanner: { position: 'absolute', top: 60, left: 20 },
  nameSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 0 },
  petName: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  petBreed: { fontSize: 15, marginTop: 4 },
  quickActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', marginTop: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  tabContent: { padding: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  emptyHealth: { alignItems: 'center', paddingVertical: 40 },
  emptyTag: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center' },
  tagRow: { flexDirection: 'row', alignItems: 'center' },
  tagUid: { fontSize: 14, fontWeight: '700', fontFamily: 'Courier' },
  tagType: { fontSize: 12, marginTop: 2 },
  tagDivider: { height: 1, marginVertical: 14 },
  tagPublicUrl: { fontSize: 13, lineHeight: 20 },
});
