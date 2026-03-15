import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="calendar" size={32} color="#f97316" />
          </View>
          <Text style={styles.appName}>EventFlow</Text>
          <Text style={styles.tagline}>Organizer Portal</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to manage your events</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="you@example.com"
              placeholderTextColor="#475569"
              value={email}
              onChangeText={v => { setEmail(v); if (errors.email) setErrors(e => ({ ...e, email: '' })); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {errors.email && <Text style={styles.errorMsg}>{errors.email}</Text>}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, errors.password && styles.inputError]}
                placeholder="Your password"
                placeholderTextColor="#475569"
                value={password}
                onChangeText={v => { setPassword(v); if (errors.password) setErrors(e => ({ ...e, password: '' })); }}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPassword(s => !s)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorMsg}>{errors.password}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.loginBtnText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Sign up link */}
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>New to EventFlow? </Text>
          <Link href="/signup" asChild>
            <TouchableOpacity>
              <Text style={styles.signupLink}>Create an account</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Reception link */}
        <TouchableOpacity style={styles.receptionLink} onPress={() => router.push('/reception')}>
          <Ionicons name="scan-outline" size={16} color="#64748b" />
          <Text style={styles.receptionLinkText}>Reception / Check-in Staff</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logo: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: '#f97316' + '22',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: '#f97316' + '40',
  },
  appName: { fontSize: 28, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: '#f97316', fontWeight: '600', marginTop: 4 },
  card: { backgroundColor: '#1e293b', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#334155' },
  title: { fontSize: 22, fontWeight: '800', color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 8 },
  input: {
    backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, color: '#f1f5f9', fontSize: 15,
  },
  inputError: { borderColor: '#ef4444' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: {
    flex: 1, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, color: '#f1f5f9', fontSize: 15,
  },
  eyeBtn: { position: 'absolute', right: 14 },
  errorMsg: { fontSize: 12, color: '#ef4444', marginTop: 4 },
  loginBtn: {
    height: 52, borderRadius: 12, backgroundColor: '#f97316', marginTop: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupText: { fontSize: 14, color: '#64748b' },
  signupLink: { fontSize: 14, color: '#f97316', fontWeight: '600' },
  receptionLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
  receptionLinkText: { fontSize: 13, color: '#64748b' },
});
