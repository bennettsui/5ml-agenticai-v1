import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getSavedTickets, removeTicket } from '../../lib/storage';
import { SavedTicket } from '../../lib/types';

const TIER_COLOR_MAP: Record<string, string> = {
  Blue: '#3b82f6', Green: '#22c55e', Orange: '#f97316', Purple: '#a855f7',
  Red: '#ef4444', Yellow: '#eab308', Pink: '#ec4899', Teal: '#14b8a6',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function TicketsScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SavedTicket[]>([]);

  useFocusEffect(
    useCallback(() => {
      getSavedTickets().then(setTickets);
    }, [])
  );

  const handleDelete = (code: string, eventTitle: string) => {
    Alert.alert(
      'Remove Ticket',
      `Remove ticket for "${eventTitle}" from this device?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeTicket(code);
            setTickets(prev => prev.filter(t => t.registration_code !== code));
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tickets}
        keyExtractor={item => item.registration_code}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Tickets</Text>
            <Text style={styles.headerSub}>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} saved</Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = TIER_COLOR_MAP[item.tier_color] || '#f97316';
          const isUpcoming = new Date(item.event_start) > new Date();
          return (
            <TouchableOpacity
              style={styles.ticketCard}
              onPress={() => router.push(`/ticket/${item.registration_code}`)}
              activeOpacity={0.85}
            >
              <View style={[styles.colorBar, { backgroundColor: color }]} />
              <View style={styles.ticketBody}>
                <View style={styles.ticketHeader}>
                  <View style={[styles.badge, isUpcoming ? styles.upcomingBadge : styles.pastBadge]}>
                    <Text style={styles.badgeText}>{isUpcoming ? 'Upcoming' : 'Past'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(item.registration_code, item.event_title)}>
                    <Ionicons name="trash-outline" size={16} color="#475569" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.eventTitle} numberOfLines={2}>{item.event_title}</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={13} color="#64748b" />
                  <Text style={styles.infoText}>{formatDate(item.event_start)}</Text>
                </View>
                {item.event_location && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={13} color="#64748b" />
                    <Text style={styles.infoText} numberOfLines={1}>{item.event_location}</Text>
                  </View>
                )}
                <View style={styles.ticketFooter}>
                  <View style={[styles.tierBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                    <Text style={[styles.tierText, { color }]}>{item.tier_name}</Text>
                  </View>
                  <View style={styles.qrHint}>
                    <Ionicons name="qr-code" size={16} color="#f97316" />
                    <Text style={styles.qrHintText}>Tap to view QR</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="ticket-outline" size={48} color="#334155" />
            </View>
            <Text style={styles.emptyTitle}>No Tickets Yet</Text>
            <Text style={styles.emptySub}>
              Register for an event and your tickets will appear here
            </Text>
            <TouchableOpacity style={styles.discoverBtn} onPress={() => router.push('/(tabs)/')}>
              <Text style={styles.discoverBtnText}>Discover Events</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  list: { padding: 16, gap: 12 },
  header: { marginBottom: 8 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#f1f5f9' },
  headerSub: { fontSize: 13, color: '#64748b', marginTop: 4 },
  ticketCard: {
    flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: '#334155',
  },
  colorBar: { width: 5 },
  ticketBody: { flex: 1, padding: 14 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  upcomingBadge: { backgroundColor: '#22c55e' + '22' },
  pastBadge: { backgroundColor: '#334155' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  eventTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 8, lineHeight: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  infoText: { fontSize: 13, color: '#64748b', flex: 1 },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  tierBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  tierText: { fontSize: 12, fontWeight: '600' },
  qrHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qrHintText: { fontSize: 12, color: '#f97316', fontWeight: '500' },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#1e293b',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#f1f5f9' },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  discoverBtn: {
    marginTop: 20, paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: '#f97316', borderRadius: 12,
  },
  discoverBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
