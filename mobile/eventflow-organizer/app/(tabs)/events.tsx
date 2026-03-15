import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, RefreshControl, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi } from '../../lib/api';
import { Event } from '../../lib/types';

const STATUS_COLORS: Record<string, string> = {
  draft: '#64748b', published: '#22c55e', ended: '#f97316', cancelled: '#ef4444',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function EventCard({ event, onPress, onDelete, onPublish }: {
  event: Event;
  onPress: () => void;
  onDelete: () => void;
  onPublish: () => void;
}) {
  const statusColor = STATUS_COLORS[event.status] || '#64748b';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{event.status}</Text>
        </View>
        <View style={styles.cardActions}>
          {event.status === 'draft' && (
            <TouchableOpacity style={styles.publishBtn} onPress={onPublish}>
              <Text style={styles.publishBtnText}>Publish</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={16} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={13} color="#64748b" />
          <Text style={styles.metaText}>{formatDate(event.start_at)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={13} color="#64748b" />
          <Text style={styles.metaText} numberOfLines={1}>{event.location || 'TBA'}</Text>
        </View>
      </View>

      <View style={styles.cardStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{event.stats?.total || 0}</Text>
          <Text style={styles.statLbl}>Registered</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{event.stats?.checked_in || 0}</Text>
          <Text style={styles.statLbl}>Checked In</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{event.tiers.length}</Text>
          <Text style={styles.statLbl}>Tiers</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const FILTERS = ['all', 'draft', 'published', 'ended', 'cancelled'] as const;

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<typeof FILTERS[number]>('all');

  const load = useCallback(async () => {
    try {
      const { events } = await eventsApi.list();
      setEvents(events);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (event: Event) => {
    Alert.alert(
      'Delete Event',
      `Delete "${event.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await eventsApi.delete(event.id);
              setEvents(prev => prev.filter(e => e.id !== event.id));
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handlePublish = async (event: Event) => {
    try {
      const { event: updated } = await eventsApi.publish(event.id);
      setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const filtered = events
    .filter(e => filter === 'all' || e.status === filter)
    .filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.location?.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/event/new')}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="#64748b" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          placeholderTextColor="#475569"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Status Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44, marginBottom: 8 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === 'all' ? `All (${events.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${events.filter(e => e.status === f).length})`}
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
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => router.push(`/event/${item.id}`)}
              onDelete={() => handleDelete(item)}
              onPublish={() => handlePublish(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#f97316" colors={['#f97316']} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color="#334155" />
              <Text style={styles.emptyTitle}>{search ? 'No results' : 'No events yet'}</Text>
              {!search && (
                <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/event/new')}>
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.createBtnText}>Create Event</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#f1f5f9' },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12, height: 44, borderWidth: 1, borderColor: '#334155' },
  searchInput: { flex: 1, color: '#f1f5f9', fontSize: 15 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  filterChipActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  filterChipText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  publishBtn: { paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#22c55e', borderRadius: 8 },
  publishBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  deleteBtn: { padding: 4 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#f1f5f9', marginBottom: 10, lineHeight: 24 },
  cardMeta: { gap: 5, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, color: '#64748b', flex: 1 },
  cardStats: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 10, padding: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: '#f1f5f9' },
  statLbl: { fontSize: 11, color: '#64748b', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#334155' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#f1f5f9', marginTop: 16, marginBottom: 16 },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#f97316', borderRadius: 12 },
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
