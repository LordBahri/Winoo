import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@stores/auth.store';
import { useTheme } from '@hooks/useTheme';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { register, isLoading, error } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const ok = await register(data.email, data.password, data.name, data.phone);
    if (ok) router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Create account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Join thousands of pet owners keeping their pets safe
            </Text>
          </View>

          <View style={styles.form}>
            <Controller control={control} name="name" render={({ field: { onChange, value, onBlur } }) => (
              <Input label="Full Name" placeholder="Your name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} autoCapitalize="words" />
            )} />
            <Controller control={control} name="email" render={({ field: { onChange, value, onBlur } }) => (
              <Input label="Email" placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} />
            )} />
            <Controller control={control} name="phone" render={({ field: { onChange, value, onBlur } }) => (
              <Input label="Phone (optional)" placeholder="+1 234 567 8900" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
            )} />
            <Controller control={control} name="password" render={({ field: { onChange, value, onBlur } }) => (
              <Input label="Password" placeholder="Min 8 characters" secure value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} />
            )} />
            <Controller control={control} name="confirmPassword" render={({ field: { onChange, value, onBlur } }) => (
              <Input label="Confirm Password" placeholder="Repeat your password" secure value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirmPassword?.message} />
            )} />

            {error && (
              <View style={[styles.errorBox, { backgroundColor: colors.danger + '15' }]}>
                <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
              </View>
            )}
            <Button label="Create Account" onPress={handleSubmit(onSubmit)} loading={isLoading} style={{ marginTop: 8 }} />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16 },
  backBtn: { marginBottom: 24 },
  backText: { fontSize: 16, fontWeight: '600' },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 22 },
  form: {},
  errorBox: { borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { fontSize: 14, fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 32 },
  footerText: { fontSize: 16 },
  footerLink: { fontSize: 16, fontWeight: '600' },
});
