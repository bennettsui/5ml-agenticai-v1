import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi } from '../../../lib/api';
import { Event } from '../../../lib/types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const STATUS_COLORS: Record<string, string> = {
  draft: '#64748b', published: '#22c55e', ended: '#f97316', cancelled: '#ef4444',
};

const TIER_COLOR_MAP: Record<string, string> = {
  Blue: '#3b82f6', Green: '#22c55e', Orange: '#f97316', Purple: '#a855f7',
  Red: '#ef4444', Yellow: '#eab308', Pink: '#ec4899', Teal: '#14b8a6',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatPrice(price: number, currency: string): string {
  if (price === 0) return 'Free';
  const sym = currency === 'HKD' ? 'HK$' : currency === 'TWD' ? 'NT$' : currency === 'SGD' ? 'S$' : '$';
  return `${sym}${(price / 100).toFixed(0)}`;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { event } = await eventsApi.get(Number(id));
      setEvent(event);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handlePublish = async () => {
    if (!event) return;
    try {
      const { event: updated } = await eventsApi.publish(event.id);
      setEvent(updated);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleShare = async () => {
    if (!event) return;
    await Share.share({
      message: `EventFlow: "${event.title}"\nhttps://5ml-agenticai-v1.fly.dev/eventflow/${event.slug}`,
    });
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#f97316" /></View>;
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Ionicons name="warning-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[event.status] || '#64748b';

  const quickActions: { icon: IconName; label: string; color: string; onPress: () => void }[] = [
    { icon: 'people-outline', label: 'Attendees', color: '#3b82f6', onPress: () => router.push(`/event/${id}/attendees`) },
    { icon: 'ticket-outline', label: 'Tiers', color: '#a855f7', onPress: () => router.push(`/event/${id}/tiers`) },
    { icon: 'list-outline', label: 'Form Fields', color: '#14b8a6', onPress: () => router.push(`/event/${id}/form-fields`) },
    { icon: 'sparkles-outline', label: 'AI Studio', color: '#eab308', onPress: () => router.push(`/event/${id}/ai-studio`) },
    { icon: 'pencil-outline', label: 'Edit', color: '#f97316', onPress: () => router.push(`/event/${id}/edit`) },
    { icon: 'scan-outline', label: 'Check-in', color: '#22c55e', onPress: () => router.push(`/reception?event=${id}`) },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#f97316" colors={['#f97316']} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{event.status}</Text>
          </View>
          {event.status === 'draft' && (
            <TouchableOpacity style={styles.publishBtn} onPress={handlePublish}>
              <Ionicons name="radio-button-on" size={14} color="#fff" />
              <Text style={styles.publishBtnText}>Publish</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.category}>{event.category}</Text>

          {/* Key Info */}
          <View style={styles.infoCard}>
            {[
              { icon: 'calendar-outline' as IconName, label: formatDate(event.start_at), sub: `${formatTime(event.start_at)} – ${formatTime(event.end_at)}` },
              { icon: 'location-outline' as IconName, label: event.location || 'TBA', sub: null },
              { icon: 'lock-closed-outline' as IconName, label: `Check-in PIN: ${event.checkin_pin}`, sub: 'Share with reception staff' },
            ].map((item, i) => (
              <View key={i} style={[styles.infoRow, i < 2 && styles.infoRowBorder]}>
                <Ionicons name={item.icon} size={16} color="#f97316" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  {item.sub && <Text style={styles.infoSub}>{item.sub}</Text>}
                </View>
              </View>
            ))}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { label: 'Registered', value: event.stats?.total || 0, color: '#3b82f6' },
              { label: 'Checked In', value: event.stats?.checked_in || 0, color: '#22c55e' },
              { label: 'Capacity', value: event.capacity ? `${event.stats?.total || 0}/${event.capacity}` : '∞', color: '#f97316' },
            ].map(stat => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={[styles.statNum, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLbl}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Manage</Text>
          <View style={styles.actionGrid}>
            {quickActions.map(action => (
              <TouchableOpacity key={action.label} style={styles.actionCard} onPress={action.onPress}>
                <View style={[styles.actionIcon, { backgroundColor: action.color + '22' }]}>
                  <Ionicons name={action.icon} size={22} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tiers Preview */}
          {event.tiers.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Ticket Tiers</Text>
              {event.tiers.map(tier => {
                const color = TIER_COLOR_MAP[tier.color] || '#f97316';
                return (
                  <View key={tier.id} style={[styles.tierRow, { borderLeftColor: color }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tierName}>{tier.name}</Text>
                      <Text style={styles.tierSold}>{tier.sold} sold{tier.capacity ? ` / ${tier.capacity}` : ''}</Text>
                    </View>
                    <Text style={[styles.tierPrice, { color }]}>{formatPrice(tier.price, tier.currency)}</Text>
                  </View>
                );
              })}
            </>
          )}

          {/* Description */}
          {event.description && (
            <>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{event.description}</Text>
            </>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Share FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleShare}>
        <Ionicons name="share-outline" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  errorText: { color: '#94a3b8', fontSize: 16, marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  publishBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#22c55e', borderRadius: 10 },
  publishBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  body: { paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#f1f5f9', lineHeight: 32, marginBottom: 6 },
  category: { fontSize: 13, color: '#f97316', fontWeight: '600', marginBottom: 16 },
  infoCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155', marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#334155' },
  infoLabel: { fontSize: 14, color: '#f1f5f9', fontWeight: '500' },
  infoSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLbl: { fontSize: 11, color: '#64748b', marginTop: 3 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 12 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  actionCard: { width: '30%', backgroundColor: '#1e293b', borderRadius: 14, padding: 14, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#334155' },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textAlign: 'center' },
  tierRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderWidth: 1, borderColor: '#334155' },
  tierName: { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  tierSold: { fontSize: 12, color: '#64748b', marginTop: 2 },
  tierPrice: { fontSize: 14, fontWeight: '700' },
  description: { fontSize: 14, color: '#94a3b8', lineHeight: 22, marginBottom: 24 },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center', shadowColor: '#f97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
});
