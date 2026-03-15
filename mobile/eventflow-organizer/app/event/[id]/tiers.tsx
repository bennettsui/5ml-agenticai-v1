import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, Switch, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi, tiersApi } from '../../../lib/api';
import { TicketTier } from '../../../lib/types';

const TIER_COLORS = ['Blue', 'Green', 'Orange', 'Purple', 'Red', 'Yellow', 'Pink', 'Teal'];
const TIER_COLOR_MAP: Record<string, string> = {
  Blue: '#3b82f6', Green: '#22c55e', Orange: '#f97316', Purple: '#a855f7',
  Red: '#ef4444', Yellow: '#eab308', Pink: '#ec4899', Teal: '#14b8a6',
};

function formatPrice(price: number, currency: string): string {
  if (price === 0) return 'Free';
  const sym = currency === 'HKD' ? 'HK$' : currency === 'TWD' ? 'NT$' : currency === 'SGD' ? 'S$' : '$';
  return `${sym}${(price / 100).toFixed(0)}`;
}

const EMPTY_FORM = { name: '', description: '', price: '0', currency: 'HKD', capacity: '', color: 'Orange', is_active: true };

export default function TiersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTier, setEditTier] = useState<TicketTier | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { event } = await eventsApi.get(Number(id));
      setTiers(event.tiers);
    } catch {}
    finally { setLoading(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openCreate = () => { setEditTier(null); setForm(EMPTY_FORM); setModalVisible(true); };
  const openEdit = (tier: TicketTier) => {
    setEditTier(tier);
    setForm({
      name: tier.name,
      description: tier.description || '',
      price: String(tier.price),
      currency: tier.currency,
      capacity: tier.capacity ? String(tier.capacity) : '',
      color: tier.color,
      is_active: tier.is_active,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Error', 'Tier name is required'); return; }
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price) || 0,
        currency: form.currency,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        color: form.color,
        is_active: form.is_active,
      };
      if (editTier) {
        const { tier } = await tiersApi.update(Number(id), editTier.id, data);
        setTiers(prev => prev.map(t => t.id === tier.id ? tier : t));
      } else {
        const { tier } = await tiersApi.create(Number(id), data);
        setTiers(prev => [...prev, tier]);
      }
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (tier: TicketTier) => {
    Alert.alert('Delete Tier', `Delete "${tier.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await tiersApi.delete(Number(id), tier.id);
            setTiers(prev => prev.filter(t => t.id !== tier.id));
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#f97316" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={tiers}
        keyExtractor={t => String(t.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const color = TIER_COLOR_MAP[item.color] || '#f97316';
          return (
            <View style={[styles.tierCard, { borderLeftColor: color }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tierName}>{item.name}</Text>
                {item.description && <Text style={styles.tierDesc}>{item.description}</Text>}
                <View style={styles.tierStats}>
                  <Text style={styles.tierStat}>{item.sold} sold</Text>
                  {item.capacity && <Text style={styles.tierStat}>/ {item.capacity} capacity</Text>}
                  {!item.is_active && <Text style={[styles.tierStat, { color: '#ef4444' }]}>Inactive</Text>}
                </View>
              </View>
              <View style={styles.tierRight}>
                <Text style={[styles.tierPrice, { color }]}>{formatPrice(item.price, item.currency)}</Text>
                <View style={styles.tierActions}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                    <Ionicons name="pencil-outline" size={16} color="#64748b" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={16} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="ticket-outline" size={40} color="#334155" />
            <Text style={styles.emptyText}>No tiers yet</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editTier ? 'Edit Tier' : 'New Tier'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            {[
              { label: 'Tier Name *', key: 'name', placeholder: 'e.g. Early Bird', keyboard: 'default' as const },
              { label: 'Description', key: 'description', placeholder: 'Optional description', keyboard: 'default' as const },
            ].map(f => (
              <View key={f.key} style={styles.fieldGroup}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={f.placeholder}
                  placeholderTextColor="#475569"
                  value={form[f.key as keyof typeof form] as string}
                  onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                  keyboardType={f.keyboard}
                />
              </View>
            ))}

            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, { flex: 2 }]}>
                <Text style={styles.label}>Price (in cents)</Text>
                <TextInput style={styles.input} placeholder="0" placeholderTextColor="#475569" value={form.price} onChangeText={v => setForm(p => ({ ...p, price: v }))} keyboardType="numeric" />
                <Text style={styles.hint}>0 = Free, 1000 = HK$10</Text>
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Currency</Text>
                <TextInput style={styles.input} placeholder="HKD" placeholderTextColor="#475569" value={form.currency} onChangeText={v => setForm(p => ({ ...p, currency: v }))} autoCapitalize="characters" />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Capacity (blank = unlimited)</Text>
              <TextInput style={styles.input} placeholder="Leave blank for unlimited" placeholderTextColor="#475569" value={form.capacity} onChangeText={v => setForm(p => ({ ...p, capacity: v }))} keyboardType="numeric" />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorGrid}>
                {TIER_COLORS.map(c => (
                  <TouchableOpacity key={c} style={[styles.colorSwatch, { backgroundColor: TIER_COLOR_MAP[c], opacity: form.color === c ? 1 : 0.4 }]} onPress={() => setForm(p => ({ ...p, color: c }))}>
                    {form.color === c && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Active (visible to attendees)</Text>
              <Switch value={form.is_active} onValueChange={v => setForm(p => ({ ...p, is_active: v }))} trackColor={{ true: '#f97316', false: '#334155' }} thumbColor="#fff" />
            </View>

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>{editTier ? 'Save Changes' : 'Create Tier'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  tierCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 14, padding: 14, borderLeftWidth: 3, borderWidth: 1, borderColor: '#334155' },
  tierName: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  tierDesc: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  tierStats: { flexDirection: 'row', gap: 6, marginTop: 4 },
  tierStat: { fontSize: 12, color: '#64748b' },
  tierRight: { alignItems: 'flex-end', gap: 6 },
  tierPrice: { fontSize: 15, fontWeight: '700' },
  tierActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 4 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#64748b', marginTop: 10 },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center', shadowColor: '#f97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  modal: { flex: 1, backgroundColor: '#0f172a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 8 },
  input: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#f1f5f9', fontSize: 15 },
  hint: { fontSize: 11, color: '#475569', marginTop: 4 },
  rowFields: { flexDirection: 'row', gap: 10 },
  colorGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  saveBtn: { height: 52, borderRadius: 14, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
