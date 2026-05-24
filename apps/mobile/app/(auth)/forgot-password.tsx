import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '@hooks/useTheme';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { apiClient } from '@services/api.service';

const schema = z.object({ email: z.string().email('Please enter a valid email') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: data.email });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>

        {sent ? (
          <View style={styles.successContainer}>
            <Text style={styles.successEmoji}>📧</Text>
            <Text style={[styles.title, { color: colors.text }]}>Check your email</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We've sent password reset instructions to your email address.
            </Text>
            <Button label="Back to Sign In" onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 32 }} />
          </View>
        ) : (
          <>
            <Text style={styles.emoji}>🔑</Text>
            <Text style={[styles.title, { color: colors.text }]}>Reset password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your email and we'll send you instructions to reset your password.
            </Text>
            <View style={styles.form}>
              <Controller control={control} name="email" render={({ field: { onChange, value, onBlur } }) => (
                <Input label="Email" placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} />
              )} />
              <Button label="Send Reset Link" onPress={handleSubmit(onSubmit)} loading={loading} style={{ marginTop: 8 }} />
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  backBtn: { marginBottom: 32 },
  backText: { fontSize: 16, fontWeight: '600' },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 12, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, lineHeight: 24, marginBottom: 32 },
  form: {},
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  successEmoji: { fontSize: 80, marginBottom: 24 },
});
