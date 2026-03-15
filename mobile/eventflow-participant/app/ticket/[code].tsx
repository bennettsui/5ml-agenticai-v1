import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { getSavedTickets } from '../../lib/storage';
import { SavedTicket } from '../../lib/types';

const TIER_COLOR_MAP: Record<string, string> = {
  Blue: '#3b82f6', Green: '#22c55e', Orange: '#f97316', Purple: '#a855f7',
  Red: '#ef4444', Yellow: '#eab308', Pink: '#ec4899', Teal: '#14b8a6',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function TicketScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [ticket, setTicket] = useState<SavedTicket | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const tickets = await getSavedTickets();
      const found = tickets.find(t => t.registration_code === code);
      setTicket(found || null);
      setLoaded(true);
    }
    load();
  }, [code]);

  const handleShare = async () => {
    if (!ticket) return;
    await Share.share({
      message: `My ticket for "${ticket.event_title}" — ${formatDate(ticket.event_start)} at ${ticket.event_location}`,
    });
  };

  if (!loaded) return null;

  // If not in local storage, build minimal display from code
  const displayTicket = ticket || {
    registration_code: code,
    first_name: '',
    last_name: '',
    email: '',
    tier_name: 'Ticket',
    tier_color: 'Orange',
    event_title: 'Your Event',
    event_start: new Date().toISOString(),
    event_location: '',
    event_slug: '',
    saved_at: new Date().toISOString(),
  };

  const color = TIER_COLOR_MAP[displayTicket.tier_color] || '#f97316';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Success Banner */}
      <View style={styles.successBanner}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={36} color="#22c55e" />
        </View>
        <Text style={styles.successTitle}>You're Registered!</Text>
        <Text style={styles.successSubtitle}>Show this QR code at the event entrance</Text>
      </View>

      {/* Ticket Card */}
      <View style={styles.ticketCard}>
        {/* Top strip */}
        <View style={[styles.ticketStrip, { backgroundColor: color }]}>
          <Text style={styles.stripText}>{displayTicket.tier_name}</Text>
          <Ionicons name="ticket" size={20} color="rgba(255,255,255,0.7)" />
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <QRCode
            value={displayTicket.registration_code}
            size={200}
            backgroundColor="transparent"
            color="#f1f5f9"
          />
        </View>

        {/* Code */}
        <Text style={styles.codeText}>{displayTicket.registration_code.slice(0, 8).toUpperCase()}</Text>

        {/* Divider with notches */}
        <View style={styles.divider}>
          <View style={styles.notchLeft} />
          <View style={styles.dashedLine} />
          <View style={styles.notchRight} />
        </View>

        {/* Ticket Info */}
        <View style={styles.ticketInfo}>
          {(displayTicket.first_name || displayTicket.last_name) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ATTENDEE</Text>
              <Text style={styles.infoValue}>
                {displayTicket.first_name} {displayTicket.last_name}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>EVENT</Text>
            <Text style={styles.infoValue} numberOfLines={2}>{displayTicket.event_title}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>DATE</Text>
            <Text style={styles.infoValue}>{formatDate(displayTicket.event_start)}</Text>
          </View>
          {displayTicket.event_location && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>VENUE</Text>
              <Text style={styles.infoValue} numberOfLines={2}>{displayTicket.event_location}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>TICKET TYPE</Text>
            <Text style={[styles.infoValue, { color }]}>{displayTicket.tier_name}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color="#f97316" />
          <Text style={styles.actionBtnText}>Share Ticket</Text>
        </TouchableOpacity>
      </View>

      {/* Reminder */}
      <View style={styles.reminder}>
        <Ionicons name="information-circle-outline" size={16} color="#64748b" />
        <Text style={styles.reminderText}>
          A confirmation email has been sent with your ticket. Save this page or take a screenshot.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 20, alignItems: 'center' },
  successBanner: { alignItems: 'center', marginBottom: 28 },
  successIcon: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#22c55e' + '22',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#f1f5f9' },
  successSubtitle: { fontSize: 14, color: '#64748b', marginTop: 6, textAlign: 'center' },
  ticketCard: {
    width: '100%', backgroundColor: '#1e293b', borderRadius: 20,
    overflow: 'hidden', borderWidth: 1, borderColor: '#334155', marginBottom: 20,
  },
  ticketStrip: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  stripText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  qrContainer: {
    alignItems: 'center', paddingVertical: 28,
    backgroundColor: '#0f172a' + 'aa',
  },
  codeText: {
    textAlign: 'center', fontSize: 13, fontWeight: '700',
    color: '#64748b', letterSpacing: 3, paddingBottom: 16,
  },
  divider: { flexDirection: 'row', alignItems: 'center', marginHorizontal: -1 },
  notchLeft: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#0f172a', marginLeft: -10,
  },
  dashedLine: { flex: 1, height: 1, borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed' },
  notchRight: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#0f172a', marginRight: -10,
  },
  ticketInfo: { padding: 20, gap: 14 },
  infoRow: {},
  infoLabel: { fontSize: 10, fontWeight: '700', color: '#475569', letterSpacing: 1.5, marginBottom: 3 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#f1f5f9' },
  actions: { width: '100%', gap: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 50, borderRadius: 12, backgroundColor: '#1e293b',
    borderWidth: 1, borderColor: '#f97316' + '60',
  },
  actionBtnText: { color: '#f97316', fontSize: 15, fontWeight: '600' },
  reminder: {
    flexDirection: 'row', gap: 8, padding: 16, marginTop: 16,
    backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155',
  },
  reminderText: { flex: 1, fontSize: 12, color: '#64748b', lineHeight: 18 },
});
