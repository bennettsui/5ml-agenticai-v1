import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Switch, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi } from '../../lib/api';
import { CreateEventInput } from '../../lib/types';

const CATEGORIES = ['Conference', 'Workshop', 'Networking', 'Concert', 'Exhibition', 'Sports', 'Seminar', 'Other'];
const TIMEZONES = ['Asia/Hong_Kong', 'Asia/Taipei', 'Asia/Singapore', 'Asia/Tokyo', 'UTC', 'America/New_York', 'Europe/London'];

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocal(str: string): string {
  return new Date(str).toISOString();
}

export default function NewEventScreen() {
  const router = useRouter();
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    start_at: toDatetimeLocal(tomorrow),
    end_at: toDatetimeLocal(dayAfter),
    timezone: 'Asia/Hong_Kong',
    category: 'Conference',
    capacity: '',
    is_public: true,
    status: 'draft' as 'draft' | 'published',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const setField = (key: string, value: unknown) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.start_at) e.start_at = 'Start time is required';
    if (!form.end_at) e.end_at = 'End time is required';
    if (form.start_at && form.end_at && new Date(form.start_at) >= new Date(form.end_at)) {
      e.end_at = 'End time must be after start time';
    }
    if (form.capacity && (isNaN(Number(form.capacity)) || Number(form.capacity) < 1)) {
      e.capacity = 'Must be a positive number';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async (publishNow = false) => {
    if (!validate()) return;
    setSaving(true);
    try {
      const data: CreateEventInput = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        location: form.location.trim() || undefined,
        start_at: fromDatetimeLocal(form.start_at),
        end_at: fromDatetimeLocal(form.end_at),
        timezone: form.timezone,
        category: form.category,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        is_public: form.is_public,
        status: publishNow ? 'published' : 'draft',
      };
      const { event } = await eventsApi.create(data);
      router.replace(`/event/${event.id}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0f172a' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.body}>
          {/* Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              placeholder="e.g. HK Tech Summit 2025"
              placeholderTextColor="#475569"
              value={form.title}
              onChangeText={v => setField('title', v)}
              autoCapitalize="words"
            />
            {errors.title && <Text style={styles.errorMsg}>{errors.title}</Text>}
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Tell attendees what to expect..."
              placeholderTextColor="#475569"
              value={form.description}
              onChangeText={v => setField('description', v)}
              multiline
              numberOfLines={5}
            />
          </View>

          {/* Location */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Venue name or address"
              placeholderTextColor="#475569"
              value={form.location}
              onChangeText={v => setField('location', v)}
              autoCapitalize="words"
            />
          </View>

          {/* Date & Time */}
          <Text style={styles.groupLabel}>Date & Time</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Starts *</Text>
            <TextInput
              style={[styles.input, errors.start_at && styles.inputError]}
              value={form.start_at}
              onChangeText={v => setField('start_at', v)}
              placeholder="YYYY-MM-DDTHH:MM"
              placeholderTextColor="#475569"
            />
            {errors.start_at && <Text style={styles.errorMsg}>{errors.start_at}</Text>}
            <Text style={styles.hint}>Format: 2025-06-15T09:00</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Ends *</Text>
            <TextInput
              style={[styles.input, errors.end_at && styles.inputError]}
              value={form.end_at}
              onChangeText={v => setField('end_at', v)}
              placeholder="YYYY-MM-DDTHH:MM"
              placeholderTextColor="#475569"
            />
            {errors.end_at && <Text style={styles.errorMsg}>{errors.end_at}</Text>}
          </View>

          {/* Timezone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Timezone</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }} contentContainerStyle={{ gap: 8 }}>
              {TIMEZONES.map(tz => (
                <TouchableOpacity
                  key={tz}
                  style={[styles.tzChip, form.timezone === tz && styles.tzChipActive]}
                  onPress={() => setField('timezone', tz)}
                >
                  <Text style={[styles.tzChipText, form.timezone === tz && { color: '#fff' }]}>{tz}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Category */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, form.category === cat && styles.catChipActive]}
                  onPress={() => setField('category', cat)}
                >
                  <Text style={[styles.catChipText, form.category === cat && { color: '#fff' }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Capacity */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Capacity (optional)</Text>
            <TextInput
              style={[styles.input, errors.capacity && styles.inputError]}
              placeholder="Leave blank for unlimited"
              placeholderTextColor="#475569"
              value={form.capacity}
              onChangeText={v => setField('capacity', v)}
              keyboardType="numeric"
            />
            {errors.capacity && <Text style={styles.errorMsg}>{errors.capacity}</Text>}
          </View>

          {/* Visibility */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Public Event</Text>
              <Text style={styles.switchSub}>Listed in the public discovery feed</Text>
            </View>
            <Switch
              value={form.is_public}
              onValueChange={v => setField('is_public', v)}
              trackColor={{ true: '#f97316', false: '#334155' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.draftBtn, saving && { opacity: 0.7 }]}
          onPress={() => handleCreate(false)}
          disabled={saving}
        >
          <Text style={styles.draftBtnText}>Save as Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.publishBtn, saving && { opacity: 0.7 }]}
          onPress={() => handleCreate(true)}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.publishBtnText}>Publish Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20 },
  groupLabel: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginTop: 8, marginBottom: 12 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 8 },
  input: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#f1f5f9', fontSize: 15 },
  inputError: { borderColor: '#ef4444' },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  errorMsg: { fontSize: 12, color: '#ef4444', marginTop: 4 },
  hint: { fontSize: 11, color: '#475569', marginTop: 4 },
  tzChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  tzChipActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  tzChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '500' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  catChipActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  catChipText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#1e293b', marginTop: 8 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: '#f1f5f9' },
  switchSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  footer: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 28, backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b' },
  draftBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  draftBtnText: { color: '#94a3b8', fontSize: 15, fontWeight: '700' },
  publishBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center' },
  publishBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
