import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Event } from '../../lib/types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function StatCard({ icon, label, value, color }: { icon: IconName; label: string; value: string | number; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DashboardScreen() {
  const router = useRouter();
  const { organizer } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { events } = await eventsApi.list();
      setEvents(events);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const stats = {
    total: events.length,
    published: events.filter(e => e.status === 'published').length,
    totalAttendees: events.reduce((sum, e) => sum + (e.stats?.total || 0), 0),
    totalCheckins: events.reduce((sum, e) => sum + (e.stats?.checked_in || 0), 0),
  };

  const recentEvents = events.slice(0, 5);

  const STATUS_COLOR: Record<string, string> = {
    draft: '#64748b', published: '#22c55e', ended: '#f97316', cancelled: '#ef4444',
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#f97316" colors={['#f97316']} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {organizer?.name?.split(' ')[0] || 'there'} 👋</Text>
            <Text style={styles.planBadge}>{(organizer?.plan || 'free').toUpperCase()} PLAN</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/event/new')}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="calendar" label="Total Events" value={stats.total} color="#f97316" />
          <StatCard icon="radio-button-on" label="Published" value={stats.published} color="#22c55e" />
          <StatCard icon="people" label="Attendees" value={stats.totalAttendees} color="#3b82f6" />
          <StatCard icon="scan" label="Check-ins" value={stats.totalCheckins} color="#a855f7" />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {[
              { icon: 'add-circle-outline' as IconName, label: 'New Event', color: '#f97316', onPress: () => router.push('/event/new') },
              { icon: 'scan-outline' as IconName, label: 'Check-in', color: '#22c55e', onPress: () => router.push('/reception') },
              { icon: 'people-outline' as IconName, label: 'Contacts', color: '#3b82f6', onPress: () => router.push('/(tabs)/contacts') },
              { icon: 'settings-outline' as IconName, label: 'Settings', color: '#a855f7', onPress: () => router.push('/(tabs)/settings') },
            ].map(action => (
              <TouchableOpacity key={action.label} style={styles.actionCard} onPress={action.onPress}>
                <View style={[styles.actionIcon, { backgroundColor: action.color + '22' }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Events</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#f97316" style={{ marginVertical: 20 }} />
          ) : recentEvents.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={32} color="#334155" />
              <Text style={styles.emptyText}>No events yet</Text>
              <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/event/new')}>
                <Text style={styles.createBtnText}>Create your first event</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recentEvents.map(event => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventRow}
                onPress={() => router.push(`/event/${event.id}`)}
              >
                <View style={styles.eventRowLeft}>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[event.status] || '#64748b' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventRowTitle} numberOfLines={1}>{event.title}</Text>
                    <Text style={styles.eventRowDate}>{formatDate(event.start_at)} · {event.stats?.total || 0} attendees</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#475569" />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#f1f5f9' },
  planBadge: { fontSize: 11, fontWeight: '700', color: '#f97316', marginTop: 2, letterSpacing: 1 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: '#1e293b', borderRadius: 14, padding: 14,
    borderLeftWidth: 3, borderWidth: 1, borderColor: '#334155',
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#f1f5f9' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '500' },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 12 },
  seeAll: { fontSize: 13, color: '#f97316', fontWeight: '600' },
  actionGrid: { flexDirection: 'row', gap: 10 },
  actionCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 14, padding: 14, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#334155' },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600', textAlign: 'center' },
  eventRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  eventRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  eventRowTitle: { fontSize: 14, fontWeight: '600', color: '#f1f5f9', flex: 1 },
  eventRowDate: { fontSize: 12, color: '#64748b', marginTop: 2 },
  emptyCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#334155' },
  emptyText: { fontSize: 14, color: '#64748b' },
  createBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f97316', borderRadius: 8, marginTop: 4 },
  createBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
