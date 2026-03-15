import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'At least 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const setField = (key: string, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signup(form.name.trim(), form.email.trim().toLowerCase(), form.password);
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="calendar" size={32} color="#f97316" />
          </View>
          <Text style={styles.appName}>EventFlow</Text>
          <Text style={styles.tagline}>Start organizing today</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Free plan — no credit card needed</Text>

          {[
            { key: 'name', label: 'Full Name', placeholder: 'Alice Chen', autoCapitalize: 'words' as const, keyboard: 'default' as const },
            { key: 'email', label: 'Email Address', placeholder: 'alice@example.com', autoCapitalize: 'none' as const, keyboard: 'email-address' as const },
          ].map(field => (
            <View key={field.key} style={styles.fieldGroup}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={[styles.input, errors[field.key] && styles.inputError]}
                placeholder={field.placeholder}
                placeholderTextColor="#475569"
                value={form[field.key as keyof typeof form]}
                onChangeText={v => setField(field.key, v)}
                autoCapitalize={field.autoCapitalize}
                keyboardType={field.keyboard}
              />
              {errors[field.key] && <Text style={styles.errorMsg}>{errors[field.key]}</Text>}
            </View>
          ))}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, errors.password && styles.inputError]}
                placeholder="Minimum 8 characters"
                placeholderTextColor="#475569"
                value={form.password}
                onChangeText={v => setField('password', v)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(s => !s)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorMsg}>{errors.password}</Text>}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[styles.input, errors.confirm && styles.inputError]}
              placeholder="Re-enter password"
              placeholderTextColor="#475569"
              value={form.confirm}
              onChangeText={v => setField('confirm', v)}
              secureTextEntry={!showPassword}
            />
            {errors.confirm && <Text style={styles.errorMsg}>{errors.confirm}</Text>}
          </View>

          <View style={styles.planNote}>
            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            <Text style={styles.planNoteText}>Free plan: 1 event, 50 RSVPs/month, QR check-in</Text>
          </View>

          <TouchableOpacity
            style={[styles.signupBtn, loading && { opacity: 0.7 }]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.signupBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#f97316' + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#f97316' + '40' },
  appName: { fontSize: 28, fontWeight: '800', color: '#f1f5f9' },
  tagline: { fontSize: 14, color: '#f97316', fontWeight: '600', marginTop: 4 },
  card: { backgroundColor: '#1e293b', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#334155' },
  title: { fontSize: 22, fontWeight: '800', color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 8 },
  input: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, color: '#f1f5f9', fontSize: 15 },
  inputError: { borderColor: '#ef4444' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, color: '#f1f5f9', fontSize: 15 },
  eyeBtn: { position: 'absolute', right: 14 },
  errorMsg: { fontSize: 12, color: '#ef4444', marginTop: 4 },
  planNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#22c55e' + '11', padding: 12, borderRadius: 10, marginBottom: 16 },
  planNoteText: { fontSize: 13, color: '#22c55e', flex: 1 },
  signupBtn: { height: 52, borderRadius: 12, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center' },
  signupBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { fontSize: 14, color: '#64748b' },
  loginLink: { fontSize: 14, color: '#f97316', fontWeight: '600' },
});
