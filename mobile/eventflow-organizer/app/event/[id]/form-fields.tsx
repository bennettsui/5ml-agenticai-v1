import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, Switch, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formFieldsApi } from '../../../lib/api';
import { FormField } from '../../../lib/types';

const FIELD_TYPES: FormField['field_type'][] = ['text', 'email', 'phone', 'number', 'textarea', 'select', 'checkbox', 'date'];
const FIELD_TYPE_ICONS: Record<string, string> = {
  text: '📝', email: '📧', phone: '📱', number: '🔢', textarea: '📄', select: '📋', checkbox: '☑️', date: '📅',
};

const EMPTY_FORM = { label: '', placeholder: '', field_type: 'text' as FormField['field_type'], required: false, options: '' };

export default function FormFieldsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editField, setEditField] = useState<FormField | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { fields } = await formFieldsApi.list(Number(id));
      setFields(fields);
    } catch {}
    finally { setLoading(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openCreate = () => { setEditField(null); setForm(EMPTY_FORM); setModalVisible(true); };
  const openEdit = (field: FormField) => {
    setEditField(field);
    setForm({
      label: field.label,
      placeholder: field.placeholder || '',
      field_type: field.field_type,
      required: field.required,
      options: field.options ? field.options.join(', ') : '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.label.trim()) { Alert.alert('Error', 'Label is required'); return; }
    setSaving(true);
    try {
      const data = {
        label: form.label.trim(),
        placeholder: form.placeholder.trim() || undefined,
        field_type: form.field_type,
        required: form.required,
        options: form.field_type === 'select' && form.options
          ? form.options.split(',').map(o => o.trim()).filter(Boolean)
          : undefined,
        field_key: editField?.field_key || form.label.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      };
      if (editField) {
        const { field } = await formFieldsApi.update(Number(id), editField.id, data);
        setFields(prev => prev.map(f => f.id === field.id ? field : f));
      } else {
        const { field } = await formFieldsApi.create(Number(id), data);
        setFields(prev => [...prev, field]);
      }
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (field: FormField) => {
    Alert.alert('Delete Field', `Delete "${field.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await formFieldsApi.delete(Number(id), field.id);
            setFields(prev => prev.filter(f => f.id !== field.id));
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
        data={fields}
        keyExtractor={f => String(f.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={16} color="#64748b" />
            <Text style={styles.noteText}>These fields appear in your event RSVP form in addition to the default fields (name, email, phone, org).</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldIcon}>{FIELD_TYPE_ICONS[item.field_type] || '📝'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>{item.label}{item.required ? ' *' : ''}</Text>
              <Text style={styles.fieldMeta}>{item.field_type}{item.options ? ` · ${item.options.length} options` : ''}</Text>
            </View>
            <View style={styles.fieldActions}>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                <Ionicons name="pencil-outline" size={16} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                <Ionicons name="trash-outline" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="list-outline" size={40} color="#334155" />
            <Text style={styles.emptyText}>No custom fields</Text>
            <Text style={styles.emptySubText}>Add fields to collect additional info from attendees</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editField ? 'Edit Field' : 'New Field'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Label *</Text>
              <TextInput style={styles.input} placeholder="e.g. Company Size" placeholderTextColor="#475569" value={form.label} onChangeText={v => setForm(p => ({ ...p, label: v }))} />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Placeholder Text</Text>
              <TextInput style={styles.input} placeholder="Optional hint text" placeholderTextColor="#475569" value={form.placeholder} onChangeText={v => setForm(p => ({ ...p, placeholder: v }))} />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Field Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {FIELD_TYPES.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeChip, form.field_type === type && styles.typeChipActive]}
                    onPress={() => setForm(p => ({ ...p, field_type: type }))}
                  >
                    <Text style={{ marginRight: 4 }}>{FIELD_TYPE_ICONS[type]}</Text>
                    <Text style={[styles.typeChipText, form.field_type === type && { color: '#fff' }]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {form.field_type === 'select' && (
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Options (comma-separated)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Option 1, Option 2, Option 3"
                  placeholderTextColor="#475569"
                  value={form.options}
                  onChangeText={v => setForm(p => ({ ...p, options: v }))}
                />
              </View>
            )}

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.formLabel}>Required Field</Text>
                <Text style={styles.switchSub}>Attendees must fill this in</Text>
              </View>
              <Switch value={form.required} onValueChange={v => setForm(p => ({ ...p, required: v }))} trackColor={{ true: '#f97316', false: '#334155' }} thumbColor="#fff" />
            </View>

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>{editField ? 'Save Changes' : 'Add Field'}</Text>}
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
  note: { flexDirection: 'row', gap: 8, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  noteText: { flex: 1, fontSize: 13, color: '#64748b', lineHeight: 18 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1e293b', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#334155' },
  fieldIcon: { fontSize: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  fieldMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  fieldActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 4 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#f1f5f9', marginTop: 10 },
  emptySubText: { fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center', shadowColor: '#f97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  modal: { flex: 1, backgroundColor: '#0f172a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  formField: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 8 },
  input: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#f1f5f9', fontSize: 15 },
  typeChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  typeChipActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  typeChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '500' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  switchSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  saveBtn: { height: 52, borderRadius: 14, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
