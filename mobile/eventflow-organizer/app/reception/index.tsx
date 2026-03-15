import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { checkinApi } from '../../lib/api';

export default function ReceptionAuthScreen() {
  const router = useRouter();
  const { event: prefilledEvent } = useLocalSearchParams<{ event?: string }>();
  const [eventId, setEventId] = useState(prefilledEvent || '');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ eventId?: string; pin?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!eventId.trim() || isNaN(Number(eventId))) e.eventId = 'Valid event ID required';
    if (!pin.trim() || pin.length < 4) e.pin = 'Enter 4-digit PIN';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await checkinApi.auth(Number(eventId), pin);
      router.push(`/reception/${eventId}`);
    } catch (err: any) {
      Alert.alert('Authentication Failed', err.message || 'Invalid event ID or PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.icon}>
            <Ionicons name="scan" size={40} color="#22c55e" />
          </View>
          <Text style={styles.title}>Reception</Text>
          <Text style={styles.subtitle}>Staff check-in portal</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Enter Event Credentials</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Event ID</Text>
            <TextInput
              style={[styles.input, errors.eventId && styles.inputError]}
              placeholder="e.g. 42"
              placeholderTextColor="#475569"
              value={eventId}
              onChangeText={v => { setEventId(v); if (errors.eventId) setErrors(e => ({ ...e, eventId: '' })); }}
              keyboardType="numeric"
            />
            {errors.eventId && <Text style={styles.errorMsg}>{errors.eventId}</Text>}
            <Text style={styles.hint}>Ask the event organizer for the Event ID</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Check-in PIN</Text>
            <TextInput
              style={[styles.input, styles.pinInput, errors.pin && styles.inputError]}
              placeholder="4-digit PIN"
              placeholderTextColor="#475569"
              value={pin}
              onChangeText={v => { setPin(v); if (errors.pin) setErrors(e => ({ ...e, pin: '' })); }}
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry
            />
            {errors.pin && <Text style={styles.errorMsg}>{errors.pin}</Text>}
            <Text style={styles.hint}>Find the PIN in the event settings</Text>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="scan" size={18} color="#fff" />
                <Text style={styles.loginBtnText}>Enter Check-in Mode</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How it works</Text>
          {[
            'Scan attendee QR codes with the camera',
            'Or search by name for manual check-in',
            'Live stats update in real-time',
          ].map((text, i) => (
            <View key={i} style={styles.infoRow}>
              <View style={styles.infoDot} />
              <Text style={styles.infoText}>{text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  iconContainer: { alignItems: 'center', marginBottom: 32 },
  icon: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#22c55e' + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#22c55e' + '44' },
  title: { fontSize: 28, fontWeight: '800', color: '#f1f5f9' },
  subtitle: { fontSize: 14, color: '#22c55e', fontWeight: '600', marginTop: 4 },
  card: { backgroundColor: '#1e293b', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#334155', marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginBottom: 20 },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 8 },
  input: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, color: '#f1f5f9', fontSize: 15 },
  pinInput: { fontSize: 24, letterSpacing: 8, textAlign: 'center' },
  inputError: { borderColor: '#ef4444' },
  errorMsg: { fontSize: 12, color: '#ef4444', marginTop: 4 },
  hint: { fontSize: 12, color: '#475569', marginTop: 4 },
  loginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 12, backgroundColor: '#22c55e', marginTop: 4 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  infoBox: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#f1f5f9', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  infoText: { fontSize: 13, color: '#94a3b8' },
});
