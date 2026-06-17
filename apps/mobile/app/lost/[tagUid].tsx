import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useTheme } from '@hooks/useTheme';
import { apiClient } from '@services/api.service';
import { Badge } from '@components/ui/Badge';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Skeleton } from '@components/ui/Skeleton';
import type { PublicPetProfile } from '@/types';

export default function LostPetPublicScreen() {
  const { tagUid } = useLocalSearchParams<{ tagUid: string }>();
  const { colors } = useTheme();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['public-pet', tagUid],
    queryFn: () => apiClient.get<PublicPetProfile>(`/nfc-tags/${tagUid}/resolve`),
    enabled: !!tagUid,
    retry: false,
  });

  const handleCall = () => {
    if (!profile) return;
    Alert.alert(
      'Contact Owner',
      `Call ${profile.owner.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${profile.owner.phoneMasked.replace(/[\s*]/g, '')}`) },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Pet Profile', headerShown: true }} />
        <View style={{ padding: 20, gap: 16 }}>
          <Skeleton height={200} borderRadius={20} />
          <Skeleton height={32} width="60%" />
          <Skeleton height={20} width="40%" />
          <Skeleton height={80} borderRadius={14} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Not Found', headerShown: true }} />
        <View style={styles.errorState}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>❓</Text>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Tag not registered</Text>
          <Text style={[styles.errorSub, { color: colors.textSecondary }]}>
            This NFC tag hasn't been registered in PetID yet.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { pet, owner, lostReport, emergencyContacts } = profile;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: pet.name,
          headerShown: true,
          headerTransparent: true,
          headerTintColor: '#fff',
        }}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          {pet.photoUrl ? (
            <Image source={{ uri: pet.photoUrl }} style={styles.heroImg} contentFit="cover" />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <Text style={{ fontSize: 72 }}>{pet.species === 'CAT' ? '🐱' : '🐶'}</Text>
            </View>
          )}
          <View style={styles.heroGradient} />
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{pet.name}</Text>
            <Text style={styles.heroBreed}>{pet.breed ?? pet.species}</Text>
            {pet.isLost && <Badge label="🚨 LOST — PLEASE HELP" variant="danger" />}
          </View>
        </View>

        <View style={styles.content}>
          {/* Lost report */}
          {lostReport && (
            <View style={[styles.lostAlert, { backgroundColor: colors.danger + '12', borderColor: colors.danger + '25' }]}>
              <Text style={[styles.lostTitle, { color: colors.danger }]}>🚨 This pet is lost!</Text>
              {lostReport.lastSeenAddress && (
                <Text style={[styles.lostDetail, { color: colors.textSecondary }]}>
                  📍 Last seen: {lostReport.lastSeenAddress}
                </Text>
              )}
              {lostReport.reward && lostReport.reward > 0 && (
                <Text style={[styles.reward, { color: colors.success }]}>
                  💰 Reward offered: ${lostReport.reward}
                </Text>
              )}
            </View>
          )}

          {/* Pet details */}
          <Card style={{ marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Pet Details</Text>
            {[
              ['Species', pet.species],
              ['Breed', pet.breed ?? '—'],
              ['Color', pet.color ?? '—'],
            ].map(([label, value]) => (
              <View key={label} style={[styles.row, { borderBottomColor: colors.separator }]}>
                <Text style={[styles.rowLabel, { color: colors.textTertiary }]}>{label}</Text>
                <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
              </View>
            ))}
          </Card>

          {/* Owner */}
          <Card style={{ marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Owner</Text>
            <View style={[styles.row, { borderBottomColor: colors.separator }]}>
              <Text style={[styles.rowLabel, { color: colors.textTertiary }]}>Name</Text>
              <Text style={[styles.rowValue, { color: colors.text }]}>{owner.name}</Text>
            </View>
            <View style={[styles.row, { borderBottomColor: colors.separator }]}>
              <Text style={[styles.rowLabel, { color: colors.textTertiary }]}>Phone</Text>
              <Text style={[styles.rowValue, { color: colors.text }]}>{owner.phoneMasked}</Text>
            </View>
          </Card>

          {/* Emergency contacts */}
          {emergencyContacts && emergencyContacts.length > 0 && (
            <Card style={{ marginBottom: 16 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Contacts</Text>
              {emergencyContacts.map((contact: { name: string; phoneMasked: string }, i: number) => (
                <View key={i} style={[styles.row, { borderBottomColor: colors.separator }]}>
                  <Text style={[styles.rowLabel, { color: colors.textTertiary }]}>{contact.name}</Text>
                  <Text style={[styles.rowValue, { color: colors.text }]}>{contact.phoneMasked}</Text>
                </View>
              ))}
            </Card>
          )}

          {/* Actions */}
          <Button label="📞 Contact Owner" onPress={handleCall} style={{ marginBottom: 12 }} />
          <Button
            label="📍 Report Sighting"
            onPress={() => {}}
            variant="secondary"
            style={{ marginBottom: 12 }}
          />
          <Text style={[styles.footer, { color: colors.textTertiary }]}>
            Powered by PetID · petid.app
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  hero: { position: 'relative', height: 320 },
  heroImg: { width: '100%', height: 320 },
  heroPlaceholder: { width: '100%', height: 320, alignItems: 'center', justifyContent: 'center' },
  heroGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  heroInfo: { position: 'absolute', bottom: 20, left: 20 },
  heroName: { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  heroBreed: { color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 8 },
  content: { padding: 20 },
  lostAlert: { borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, gap: 6 },
  lostTitle: { fontSize: 16, fontWeight: '800' },
  lostDetail: { fontSize: 14 },
  reward: { fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '600' },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 16 },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  errorSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
