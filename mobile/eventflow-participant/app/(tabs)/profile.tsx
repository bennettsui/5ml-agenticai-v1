import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { participantApi } from '../../lib/api';
import { getSessionId, getCachedProfile, setCachedProfile } from '../../lib/storage';
import { ParticipantProfile } from '../../lib/types';

const ROLES = ['Attendee', 'Speaker', 'Sponsor', 'Volunteer', 'Organizer', 'Press'];
const INTERESTS = ['Technology', 'Business', 'Design', 'Art', 'Music', 'Sports', 'Health', 'Education', 'Food', 'Travel'];
const HOW_HEARD = ['Friend', 'Social Media', 'Email', 'Google Search', 'Newsletter', 'Other'];

function SelectChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Partial<ParticipantProfile>>({});
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getCachedProfile().then(setProfile);
    }, [])
  );

  const updateField = async (key: keyof ParticipantProfile, value: unknown) => {
    try {
      setProfile(p => ({ ...p, [key]: value }));
      await setCachedProfile({ ...profile, [key]: value });
      const sid = await getSessionId();
      await participantApi.updateProfile(sid, key, value);
    } catch {}
  };

  const toggleInterest = (interest: string) => {
    const current = profile.interests || [];
    const updated = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest];
    updateField('interests', updated);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color="#f97316" />
          </View>
          <View style={styles.onlineDot} />
        </View>
        <Text style={styles.headerTitle}>My Profile</Text>
        <Text style={styles.headerSub}>Personalize your EventFlow experience</Text>
      </View>

      {/* Role */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>I am a</Text>
        <View style={styles.chipGrid}>
          {ROLES.map(role => (
            <SelectChip
              key={role}
              label={role}
              selected={profile.role === role}
              onPress={() => updateField('role', role)}
            />
          ))}
        </View>
      </View>

      {/* Interests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Interests</Text>
        <Text style={styles.sectionSub}>Select all that apply</Text>
        <View style={styles.chipGrid}>
          {INTERESTS.map(interest => (
            <SelectChip
              key={interest}
              label={interest}
              selected={(profile.interests || []).includes(interest)}
              onPress={() => toggleInterest(interest)}
            />
          ))}
        </View>
      </View>

      {/* How they heard */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How did you find EventFlow?</Text>
        <View style={styles.chipGrid}>
          {HOW_HEARD.map(how => (
            <SelectChip
              key={how}
              label={how}
              selected={profile.how_heard === how}
              onPress={() => updateField('how_heard', how)}
            />
          ))}
        </View>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <View style={styles.appInfoRow}>
          <Ionicons name="logo-github" size={18} color="#64748b" />
          <Text style={styles.appInfoText}>EventFlow · Version 1.0.0</Text>
        </View>
        <Text style={styles.appInfoSub}>
          Your data is stored anonymously on this device.{'\n'}
          No account required to browse and RSVP.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#1e293b',
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#f97316',
  },
  onlineDot: {
    position: 'absolute', bottom: 4, right: 4, width: 14, height: 14,
    borderRadius: 7, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#0f172a',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#f1f5f9' },
  headerSub: { fontSize: 14, color: '#64748b', marginTop: 4, textAlign: 'center' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 4 },
  sectionSub: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
  },
  chipSelected: { backgroundColor: '#f97316', borderColor: '#f97316' },
  chipText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  appInfo: {
    marginHorizontal: 20, padding: 16, backgroundColor: '#1e293b',
    borderRadius: 16, borderWidth: 1, borderColor: '#334155',
  },
  appInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  appInfoText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  appInfoSub: { fontSize: 13, color: '#475569', lineHeight: 20 },
});
