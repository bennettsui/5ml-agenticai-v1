import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, RefreshControl, ActivityIndicator, ScrollView, Modal,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { attendeesApi } from '../../../lib/api';
import { Attendee } from '../../../lib/types';

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  registered: { bg: '#3b82f6' + '22', text: '#3b82f6', label: 'Registered' },
  checked_in: { bg: '#22c55e' + '22', text: '#22c55e', label: 'Checked In' },
  cancelled: { bg: '#ef4444' + '22', text: '#ef4444', label: 'Cancelled' },
};

const TIER_COLORS: Record<string, string> = {
  Blue: '#3b82f6', Green: '#22c55e', Orange: '#f97316', Purple: '#a855f7',
  Red: '#ef4444', Yellow: '#eab308', Pink: '#ec4899', Teal: '#14b8a6',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function AttendeesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Attendee | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  const load = useCallback(async (reset = false) => {
    const p = reset ? 1 : page;
    try {
      const { attendees: items, total: tot, pages } = await attendeesApi.list(Number(id), {
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: p,
        limit: 25,
      });
      if (reset) { setAttendees(items); setPage(1); }
      else setAttendees(prev => [...prev, ...items]);
      setTotal(tot);
      setHasMore(p < pages);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [id, search, statusFilter, page]);

  useFocusEffect(useCallback(() => { setLoading(true); setPage(1); load(true); }, [id, search, statusFilter]));

  const handleCheckin = async (attendee: Attendee) => {
    if (attendee.status === 'checked_in') return;
    setCheckingIn(true);
    try {
      const { attendee: updated } = await attendeesApi.checkin(Number(id), attendee.id);
      setAttendees(prev => prev.map(a => a.id === updated.id ? updated : a));
      if (selected?.id === attendee.id) setSelected(updated);
    } catch (err: any) {
      Alert.alert('Check-in Failed', err.message);
    } finally {
      setCheckingIn(false);
    }
  };

  const s = STATUS_COLORS;

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="#64748b" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor="#475569"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color="#64748b" /></TouchableOpacity>}
      </View>

      {/* Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 40, marginBottom: 8 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {[
          { key: 'all', label: `All (${total})` },
          { key: 'registered', label: 'Registered' },
          { key: 'checked_in', label: 'Checked In' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map(f => (
          <TouchableOpacity key={f.key} style={[styles.filterChip, statusFilter === f.key && styles.filterChipActive]} onPress={() => setStatusFilter(f.key)}>
            <Text style={[styles.filterText, statusFilter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#f97316" /></View>
      ) : (
        <FlatList
          data={attendees}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#f97316" colors={['#f97316']} />}
          onEndReached={() => { if (hasMore) { setPage(p => p + 1); } }}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => {
            const sc = s[item.status] || s.registered;
            const tierColor = TIER_COLORS[item.tier_color || ''] || '#f97316';
            return (
              <TouchableOpacity style={styles.row} onPress={() => setSelected(item)}>
                <View style={styles.rowAvatar}>
                  <Text style={styles.rowInitials}>
                    {item.first_name?.[0]}{item.last_name?.[0]}
                  </Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowName}>{item.first_name} {item.last_name}</Text>
                  <Text style={styles.rowEmail} numberOfLines={1}>{item.email}</Text>
                  {item.organization && <Text style={styles.rowOrg} numberOfLines={1}>{item.organization}</Text>}
                </View>
                <View style={styles.rowRight}>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
                  </View>
                  <Text style={[styles.tierBadge, { color: tierColor }]}>{item.tier_name}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color="#334155" />
              <Text style={styles.emptyText}>No attendees {search ? 'found' : 'yet'}</Text>
            </View>
          }
        />
      )}

      {/* Attendee Detail Modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        {selected && (() => {
          const sc = s[selected.status] || s.registered;
          const tierColor = TIER_COLORS[selected.tier_color || ''] || '#f97316';
          return (
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Attendee</Text>
                <TouchableOpacity onPress={() => setSelected(null)}>
                  <Ionicons name="close" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.modalBody}>
                <Text style={styles.modalName}>{selected.first_name} {selected.last_name}</Text>
                {selected.title && <Text style={styles.modalMeta}>{selected.title}</Text>}
                {selected.organization && <Text style={styles.modalMeta}>{selected.organization}</Text>}

                <View style={[styles.statusBadge, { backgroundColor: sc.bg, alignSelf: 'center', marginTop: 8, paddingVertical: 6, paddingHorizontal: 16 }]}>
                  <Text style={[styles.statusText, { color: sc.text, fontSize: 14 }]}>{sc.label}</Text>
                </View>

                {[
                  { label: 'Email', value: selected.email },
                  { label: 'Phone', value: selected.phone || '—' },
                  { label: 'Ticket Tier', value: selected.tier_name || '—' },
                  { label: 'Registered', value: formatDate(selected.created_at) },
                  { label: 'Check-in Time', value: selected.checked_in_at ? `${formatDate(selected.checked_in_at)} ${formatTime(selected.checked_in_at)}` : '—' },
                  { label: 'Registration Code', value: selected.registration_code.slice(0, 8).toUpperCase() },
                ].map(item => (
                  <View key={item.label} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <Text style={styles.detailValue}>{item.value}</Text>
                  </View>
                ))}

                {selected.remarks && (
                  <View style={styles.remarksBox}>
                    <Text style={styles.detailLabel}>Remarks</Text>
                    <Text style={styles.detailValue}>{selected.remarks}</Text>
                  </View>
                )}

                {selected.status !== 'checked_in' && (
                  <TouchableOpacity
                    style={[styles.checkinBtn, checkingIn && { opacity: 0.7 }]}
                    onPress={() => handleCheckin(selected)}
                    disabled={checkingIn}
                  >
                    {checkingIn ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.checkinBtnText}>Mark as Checked In</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          );
        })()}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', marginHorizontal: 16, marginTop: 8, borderRadius: 12, paddingHorizontal: 12, marginBottom: 8, height: 44, borderWidth: 1, borderColor: '#334155' },
  searchInput: { flex: 1, color: '#f1f5f9', fontSize: 15 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  filterChipActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  filterText: { color: '#94a3b8', fontSize: 12, fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  rowAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  rowInitials: { fontSize: 14, fontWeight: '700', color: '#f97316' },
  rowBody: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '600', color: '#f1f5f9' },
  rowEmail: { fontSize: 12, color: '#64748b', marginTop: 1 },
  rowOrg: { fontSize: 11, color: '#475569', marginTop: 1 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  tierBadge: { fontSize: 10, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#64748b', marginTop: 10 },
  modal: { flex: 1, backgroundColor: '#0f172a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  modalBody: { padding: 24 },
  modalName: { fontSize: 22, fontWeight: '800', color: '#f1f5f9', textAlign: 'center' },
  modalMeta: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  detailLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  detailValue: { fontSize: 14, color: '#f1f5f9', fontWeight: '500', flex: 1, textAlign: 'right' },
  remarksBox: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginTop: 12 },
  checkinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 14, backgroundColor: '#22c55e', marginTop: 24 },
  checkinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
