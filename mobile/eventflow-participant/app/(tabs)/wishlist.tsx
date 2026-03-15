import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wishlistApi } from '../../lib/api';
import { WishlistItem } from '../../lib/types';

const CATEGORIES = ['feature', 'ux', 'integration', 'ai', 'general'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  feature: '✨ Feature', ux: '🎨 UX', integration: '🔗 Integration', ai: '🤖 AI', general: '💬 General',
};

const STATUS_COLORS: Record<string, string> = {
  open: '#64748b', planned: '#3b82f6', done: '#22c55e', declined: '#ef4444',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ItemCard({ item, onVote }: { item: WishlistItem; onVote: (id: number) => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{CATEGORY_LABELS[item.category] || item.category}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '33' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={3}>{item.description}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.footerMeta}>by {item.author_name} · {formatDate(item.created_at)}</Text>
        <TouchableOpacity style={styles.voteBtn} onPress={() => onVote(item.id)}>
          <Ionicons name="arrow-up" size={14} color="#f97316" />
          <Text style={styles.voteCount}>{item.votes}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function WishlistScreen() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    author_name: '',
    author_email: '',
    title: '',
    description: '',
    category: 'feature' as typeof CATEGORIES[number],
  });

  async function load() {
    try {
      const { items } = await wishlistApi.getItems();
      setItems(items);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const handleVote = async (id: number) => {
    try {
      const { votes } = await wishlistApi.vote(id);
      setItems(prev => prev.map(item => item.id === id ? { ...item, votes } : item));
    } catch {}
  };

  const handleSubmit = async () => {
    if (!form.author_name.trim() || !form.title.trim() || !form.description.trim()) {
      Alert.alert('Missing Fields', 'Please fill in your name, title, and description.');
      return;
    }
    setSubmitting(true);
    try {
      const { item } = await wishlistApi.submit({
        author_name: form.author_name.trim(),
        author_email: form.author_email.trim() || undefined,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
      });
      setItems(prev => [item, ...prev]);
      setModalVisible(false);
      setForm({ author_name: '', author_email: '', title: '', description: '', category: 'feature' });
    } catch (err: any) {
      Alert.alert('Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = filter
    ? items.filter(i => i.category === filter || i.status === filter)
    : items;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Wishlist</Text>
          <Text style={styles.headerSub}>Vote and request features</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Category Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {(['', ...CATEGORIES] as const).map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, filter === cat && styles.filterChipActive]}
            onPress={() => setFilter(cat)}
          >
            <Text style={[styles.filterChipText, filter === cat && styles.filterChipTextActive]}>
              {cat === '' ? 'All' : CATEGORY_LABELS[cat]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : (
        <FlatList
          data={filteredItems.sort((a, b) => b.votes - a.votes)}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => <ItemCard item={item} onVote={handleVote} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#f97316" colors={['#f97316']} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bulb-outline" size={48} color="#334155" />
              <Text style={styles.emptyTitle}>No items yet</Text>
              <Text style={styles.emptySub}>Be the first to submit a feature request!</Text>
            </View>
          }
        />
      )}

      {/* Submit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submit Request</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Your Name *</Text>
              <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor="#475569" value={form.author_name} onChangeText={v => setForm(f => ({ ...f, author_name: v }))} />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email (optional)</Text>
              <TextInput style={styles.input} placeholder="john@example.com" placeholderTextColor="#475569" value={form.author_email} onChangeText={v => setForm(f => ({ ...f, author_email: v }))} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput style={styles.input} placeholder="Short feature title" placeholderTextColor="#475569" value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput style={[styles.input, styles.textarea]} placeholder="Describe your request in detail..." placeholderTextColor="#475569" value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} multiline numberOfLines={4} />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat} style={[styles.catOption, form.category === cat && styles.catOptionActive]} onPress={() => setForm(f => ({ ...f, category: cat }))}>
                    <Text style={[styles.catOptionText, form.category === cat && { color: '#fff' }]}>{CATEGORY_LABELS[cat]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#f1f5f9' },
  headerSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center' },
  filterScroll: { maxHeight: 44, marginBottom: 8 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  filterChipActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  filterChipText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 10 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  categoryBadge: { backgroundColor: '#f97316' + '22', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  categoryText: { color: '#f97316', fontSize: 11, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#f1f5f9', marginBottom: 6 },
  cardDesc: { fontSize: 14, color: '#94a3b8', lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  footerMeta: { fontSize: 12, color: '#475569' },
  voteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f97316' + '22', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  voteCount: { fontSize: 13, fontWeight: '700', color: '#f97316' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#f1f5f9', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#64748b', marginTop: 6, textAlign: 'center' },
  modal: { flex: 1, backgroundColor: '#0f172a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 8 },
  input: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#f1f5f9', fontSize: 15 },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  catOptionActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  catOptionText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  submitBtn: { height: 52, borderRadius: 14, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
