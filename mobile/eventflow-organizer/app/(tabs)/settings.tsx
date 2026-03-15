import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { authApi } from '../../lib/api';

const PLAN_DETAILS: Record<string, { color: string; label: string; features: string[] }> = {
  free: {
    color: '#64748b',
    label: 'Free',
    features: ['1 active event', '50 RSVPs/month', 'QR check-in', 'Email confirmations'],
  },
  starter: {
    color: '#3b82f6',
    label: 'Starter — $19/mo',
    features: ['5 events', '500 RSVPs/month', 'Custom form fields', 'AI Studio (5 tools)', 'CRM'],
  },
  pro: {
    color: '#f97316',
    label: 'Pro — $49/mo',
    features: ['Unlimited events', 'Unlimited RSVPs', 'Stripe payments', 'All AI tools', 'Team access (3 seats)', 'API'],
  },
  explab_staff: {
    color: '#a855f7',
    label: 'Staff',
    features: ['Full access'],
  },
};

export default function SettingsScreen() {
  const { organizer, logout, refreshOrganizer } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(organizer?.name || '');
  const [saving, setSaving] = useState(false);

  const planInfo = PLAN_DETAILS[organizer?.plan || 'free'];

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await authApi.updateMe({ name: name.trim() });
      await refreshOrganizer();
      setEditing(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {organizer?.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        {editing ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              autoFocus
              placeholder="Your name"
              placeholderTextColor="#475569"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={18} color="#fff" />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditing(false); setName(organizer?.name || ''); }}>
              <Ionicons name="close" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.nameRow}>
            <Text style={styles.profileName}>{organizer?.name}</Text>
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Ionicons name="pencil-outline" size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.profileEmail}>{organizer?.email}</Text>
      </View>

      {/* Plan */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Plan</Text>
        <View style={[styles.planCard, { borderColor: planInfo.color + '55' }]}>
          <View style={styles.planHeader}>
            <View style={[styles.planBadge, { backgroundColor: planInfo.color }]}>
              <Text style={styles.planBadgeText}>{organizer?.plan?.toUpperCase()}</Text>
            </View>
            <Text style={[styles.planLabel, { color: planInfo.color }]}>{planInfo.label}</Text>
          </View>
          {planInfo.features.map(f => (
            <View key={f} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color={planInfo.color} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Info</Text>
        <View style={styles.infoCard}>
          {[
            { label: 'Organizer ID', value: `#${organizer?.id}` },
            { label: 'Member Since', value: organizer?.created_at ? new Date(organizer.created_at).getFullYear().toString() : '—' },
          ].map(item => (
            <View key={item.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>EventFlow Organizer</Text>
          </View>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  profileSection: { alignItems: 'center', paddingTop: 60, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#1e293b', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f97316' + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 2, borderColor: '#f97316' },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#f97316' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  profileName: { fontSize: 20, fontWeight: '700', color: '#f1f5f9' },
  profileEmail: { fontSize: 14, color: '#64748b' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  nameInput: { flex: 1, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, color: '#f1f5f9', fontSize: 16 },
  saveBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  planCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  planBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  planBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  planLabel: { fontSize: 15, fontWeight: '700' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14, color: '#94a3b8' },
  infoCard: { backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#0f172a' },
  infoLabel: { fontSize: 14, color: '#64748b' },
  infoValue: { fontSize: 14, color: '#f1f5f9', fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 14, backgroundColor: '#ef4444' + '22', borderWidth: 1, borderColor: '#ef4444' + '44' },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#ef4444' },
});
