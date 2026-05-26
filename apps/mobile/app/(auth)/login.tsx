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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@stores/auth.store';
import { useTheme } from '@hooks/useTheme';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login, isLoading, error } = useAuthStore();

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const ok = await login(data.email, data.password);
    if (ok) router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & heading */}
          <Animated.View entering={FadeInDown.delay(0).duration(500).springify()} style={styles.header}>
            <View style={[styles.logoWrap, { backgroundColor: colors.primary + '15' }]}>
              <Text style={styles.logoEmoji}>🐾</Text>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to manage your pets
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(120).duration(450).springify()} style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Email"
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  secure
                  autoComplete="password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />
            <TouchableOpacity
              style={styles.forgotWrap}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={[styles.forgot, { color: colors.primary }]}>Forgot password?</Text>
            </TouchableOpacity>

            {error && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                style={[styles.errorBox, { backgroundColor: colors.danger + '12', borderColor: colors.danger + '25' }]}
              >
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
              </Animated.View>
            )}

            <Button
              label={isLoading ? 'Signing in…' : 'Sign In'}
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.signInBtn}
            />
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeInDown.delay(220).duration(400)} style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Create one</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 32 },

  header: { alignItems: 'center', marginBottom: 44 },
  logoWrap: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoEmoji: { fontSize: 46 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.7, marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center' },

  form: { gap: 0 },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 12, marginTop: -4 },
  forgot: { fontSize: 14, fontWeight: '600' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  errorIcon: { fontSize: 16 },
  errorText: { fontSize: 14, fontWeight: '500', flex: 1 },
  signInBtn: { marginTop: 4 },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: 36,
  },
  footerText: { fontSize: 16 },
  footerLink: { fontSize: 16, fontWeight: '700' },
});
