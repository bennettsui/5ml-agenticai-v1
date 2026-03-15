import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { contactsApi } from '../../lib/api';
import { Contact } from '../../lib/types';

function initials(contact: Contact): string {
  return `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`.toUpperCase() || '?';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const AVATAR_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#eab308'];

function ContactRow({ contact, onPress }: { contact: Contact; onPress: () => void }) {
  const colorIndex = contact.id % AVATAR_COLORS.length;
  const color = AVATAR_COLORS[colorIndex];

  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={[styles.avatar, { backgroundColor: color + '22', borderColor: color + '55' }]}>
        <Text style={[styles.avatarText, { color }]}>{initials(contact)}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName}>{contact.first_name} {contact.last_name}</Text>
        <Text style={styles.rowEmail} numberOfLines={1}>{contact.email}</Text>
        {contact.organization && (
          <Text style={styles.rowOrg} numberOfLines={1}>{contact.organization}</Text>
        )}
      </View>
      <View style={styles.rowRight}>
        {contact.event_count !== undefined && (
          <Text style={styles.eventCount}>{contact.event_count} event{contact.event_count !== 1 ? 's' : ''}</Text>
        )}
        <Ionicons name="chevron-forward" size={14} color="#475569" />
      </View>
    </TouchableOpacity>
  );
}

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<Contact | null>(null);

  const load = useCallback(async (reset = false) => {
    const p = reset ? 1 : page;
    try {
      const { contacts: items, pages } = await contactsApi.list({ search: search || undefined, page: p, limit: 30 });
      if (reset) { setContacts(items); setPage(1); }
      else setContacts(prev => [...prev, ...items]);
      setHasMore(p < pages);
    } catch {}
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  }, [search, page]);

  useFocusEffect(useCallback(() => { setLoading(true); setPage(1); load(true); }, [search]));

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setPage(p => p + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contacts</Text>
        <Text style={styles.headerSub}>Your event CRM</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="#64748b" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, org..."
          placeholderTextColor="#475569"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => <ContactRow contact={item} onPress={() => setSelected(item)} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#f97316" colors={['#f97316']} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#f97316" style={{ marginVertical: 12 }} /> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color="#334155" />
              <Text style={styles.emptyTitle}>No contacts yet</Text>
              <Text style={styles.emptySub}>Contacts are added when attendees register for your events</Text>
            </View>
          }
        />
      )}

      {/* Contact Detail Modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        {selected && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contact</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.modalAvatar}>
                <Text style={styles.modalAvatarText}>{initials(selected)}</Text>
              </View>
              <Text style={styles.modalName}>{selected.first_name} {selected.last_name}</Text>
              {selected.title && <Text style={styles.modalMeta}>{selected.title}</Text>}
              {selected.organization && <Text style={styles.modalMeta}>{selected.organization}</Text>}

              {[
                { icon: 'mail-outline' as const, label: 'Email', value: selected.email },
                { icon: 'call-outline' as const, label: 'Phone', value: selected.phone || '—' },
                { icon: 'calendar-outline' as const, label: 'First Seen', value: formatDate(selected.created_at) },
                { icon: 'time-outline' as const, label: 'Last Seen', value: formatDate(selected.last_seen_at) },
              ].map(item => (
                <View key={item.label} style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name={item.icon} size={16} color="#f97316" />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <Text style={styles.detailValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#f1f5f9' },
  headerSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, marginBottom: 8, height: 44, borderWidth: 1, borderColor: '#334155' },
  searchInput: { flex: 1, color: '#f1f5f9', fontSize: 15 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatarText: { fontSize: 15, fontWeight: '700' },
  rowBody: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '600', color: '#f1f5f9' },
  rowEmail: { fontSize: 13, color: '#64748b', marginTop: 2 },
  rowOrg: { fontSize: 12, color: '#475569', marginTop: 1 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  eventCount: { fontSize: 11, color: '#f97316', fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#f1f5f9', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  modal: { flex: 1, backgroundColor: '#0f172a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  modalBody: { padding: 24, alignItems: 'center' },
  modalAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f97316' + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#f97316' + '55' },
  modalAvatarText: { fontSize: 24, fontWeight: '800', color: '#f97316' },
  modalName: { fontSize: 22, fontWeight: '800', color: '#f1f5f9', textAlign: 'center' },
  modalMeta: { fontSize: 14, color: '#64748b', marginTop: 4, textAlign: 'center' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', marginTop: 20 },
  detailIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f97316' + '22', alignItems: 'center', justifyContent: 'center' },
  detailLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 15, color: '#f1f5f9', fontWeight: '500', marginTop: 2 },
});
