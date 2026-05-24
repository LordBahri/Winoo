import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useTheme } from '@hooks/useTheme';
import { useCreatePet } from '@hooks/usePets';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Card } from '@components/ui/Card';

const schema = z.object({
  name: z.string().min(1, 'Pet name is required'),
  species: z.enum(['DOG', 'CAT', 'BIRD', 'RABBIT', 'FISH', 'REPTILE', 'OTHER']),
  breed: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'UNKNOWN']),
  color: z.string().optional(),
  weight: z.string().optional(),
  microchipId: z.string().optional(),
  isNeutered: z.boolean(),
});
type FormData = z.infer<typeof schema>;

const SPECIES = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'FISH', 'REPTILE', 'OTHER'] as const;
const SPECIES_EMOJI: Record<string, string> = { DOG: '🐶', CAT: '🐱', BIRD: '🐦', RABBIT: '🐰', FISH: '🐟', REPTILE: '🦎', OTHER: '🐾' };
const GENDERS = ['MALE', 'FEMALE', 'UNKNOWN'] as const;

export default function AddPetScreen() {
  const { colors } = useTheme();
  const createPet = useCreatePet();
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { species: 'DOG', gender: 'UNKNOWN', isNeutered: false },
  });

  const selectedSpecies = watch('species');
  const selectedGender = watch('gender');
  const isNeutered = watch('isNeutered');

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const pet = await createPet.mutateAsync({
        ...data,
        weight: data.weight ? parseFloat(data.weight) : undefined,
        photoUri: photoUri ?? undefined,
      });
      Alert.alert(
        '🎉 Pet Added!',
        `${data.name} has been added. Would you like to link an NFC tag now?`,
        [
          { text: 'Later', onPress: () => router.replace('/(tabs)/pets') },
          { text: 'Link Tag', onPress: () => { router.replace('/(tabs)/pets'); router.push('/scan'); } },
        ],
      );
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to add pet');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: 'Add Pet', headerBackTitle: 'Cancel' }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Photo */}
        <TouchableOpacity style={styles.photoArea} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>📷</Text>
              <Text style={[styles.photoLabel, { color: colors.textSecondary }]}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Species selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Species</Text>
          <View style={styles.chipRow}>
            {SPECIES.map(s => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.chip,
                  { backgroundColor: selectedSpecies === s ? colors.primary + '20' : colors.surfaceSecondary },
                  selectedSpecies === s && { borderColor: colors.primary, borderWidth: 1.5 },
                ]}
                onPress={() => setValue('species', s)}
              >
                <Text style={{ fontSize: 18 }}>{SPECIES_EMOJI[s]}</Text>
                <Text style={[styles.chipText, { color: selectedSpecies === s ? colors.primary : colors.text }]}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Card style={{ marginBottom: 16 }}>
          <Controller control={control} name="name" render={({ field: { onChange, value, onBlur } }) => (
            <Input label="Pet Name" placeholder="e.g. Luna" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} />
          )} />
          <Controller control={control} name="breed" render={({ field: { onChange, value, onBlur } }) => (
            <Input label="Breed (optional)" placeholder="e.g. Golden Retriever" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />

          {/* Gender */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Gender</Text>
          <View style={[styles.chipRow, { marginBottom: 16 }]}>
            {GENDERS.map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, { backgroundColor: selectedGender === g ? colors.primary + '20' : colors.surfaceSecondary }, selectedGender === g && { borderColor: colors.primary, borderWidth: 1.5 }]}
                onPress={() => setValue('gender', g)}
              >
                <Text style={[styles.chipText, { color: selectedGender === g ? colors.primary : colors.text }]}>
                  {g === 'MALE' ? '♂ Male' : g === 'FEMALE' ? '♀ Female' : '— Unknown'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Controller control={control} name="color" render={({ field: { onChange, value, onBlur } }) => (
            <Input label="Color (optional)" placeholder="e.g. Golden, Black & White" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller control={control} name="weight" render={({ field: { onChange, value, onBlur } }) => (
            <Input label="Weight kg (optional)" placeholder="e.g. 8.5" keyboardType="decimal-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller control={control} name="microchipId" render={({ field: { onChange, value, onBlur } }) => (
            <Input label="Microchip ID (optional)" placeholder="15-digit number" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />

          {/* Neutered toggle */}
          <TouchableOpacity
            style={[styles.toggleRow, { borderColor: colors.borderLight }]}
            onPress={() => setValue('isNeutered', !isNeutered)}
          >
            <View>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Neutered / Spayed</Text>
              <Text style={[styles.toggleSub, { color: colors.textSecondary }]}>Has been sterilized</Text>
            </View>
            <View style={[styles.toggle, { backgroundColor: isNeutered ? colors.primary : colors.surfaceTertiary }]}>
              <View style={[styles.toggleThumb, isNeutered && styles.toggleThumbOn]} />
            </View>
          </TouchableOpacity>
        </Card>

        <Button label="Add Pet" onPress={handleSubmit(onSubmit)} loading={createPet.isPending} style={{ marginBottom: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20 },
  photoArea: { alignItems: 'center', marginBottom: 24 },
  photoPreview: { width: 120, height: 120, borderRadius: 30 },
  photoPlaceholder: { width: 120, height: 120, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  photoLabel: { fontSize: 14, fontWeight: '600' },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3, marginBottom: 10, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  chipText: { fontSize: 13, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  toggleLabel: { fontSize: 15, fontWeight: '600' },
  toggleSub: { fontSize: 13, marginTop: 2 },
  toggle: { width: 48, height: 28, borderRadius: 14, justifyContent: 'center', paddingHorizontal: 2 },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  toggleThumbOn: { marginLeft: 20 },
});
