import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { publicApi } from '../../lib/api';
import { Event, TicketTier } from '../../lib/types';

const TIER_COLOR_MAP: Record<string, string> = {
  Blue: '#3b82f6', Green: '#22c55e', Orange: '#f97316', Purple: '#a855f7',
  Red: '#ef4444', Yellow: '#eab308', Pink: '#ec4899', Teal: '#14b8a6',
};

function formatDate(iso: string, full = false): string {
  const d = new Date(iso);
  if (full) {
    return d.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatPrice(price: number, currency: string): string {
  if (price === 0) return 'Free';
  const sym = currency === 'HKD' ? 'HK$' : currency === 'TWD' ? 'NT$' : currency === 'SGD' ? 'S$' : '$';
  return `${sym}${(price / 100).toFixed(0)}`;
}

function TierCard({ tier }: { tier: TicketTier }) {
  const color = TIER_COLOR_MAP[tier.color] || '#f97316';
  const isSoldOut = tier.capacity !== null && tier.sold >= tier.capacity;
  const remaining = tier.capacity !== null ? tier.capacity - tier.sold : null;

  return (
    <View style={[styles.tierCard, { borderLeftColor: color }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.tierName}>{tier.name}</Text>
        {tier.description && <Text style={styles.tierDesc}>{tier.description}</Text>}
        {remaining !== null && (
          <Text style={[styles.tierRemaining, isSoldOut && { color: '#ef4444' }]}>
            {isSoldOut ? 'Sold out' : `${remaining} remaining`}
          </Text>
        )}
      </View>
      <Text style={[styles.tierPrice, { color }]}>{formatPrice(tier.price, tier.currency)}</Text>
    </View>
  );
}

export default function EventDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { event } = await publicApi.getEvent(slug);
        setEvent(event);
        navigation.setOptions({ title: event.title });
      } catch (err: any) {
        setError(err.message || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const handleShare = async () => {
    if (!event) return;
    await Share.share({
      message: `Check out "${event.title}" on EventFlow!\nhttps://5ml-agenticai-v1.fly.dev/eventflow/${event.slug}`,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.center}>
        <Ionicons name="warning-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error || 'Event not found'}</Text>
      </View>
    );
  }

  const activeTiers = event.tiers.filter(t => t.is_active);
  const isFull = event.capacity !== null && (event.stats?.total ?? 0) >= event.capacity;
  const isEnded = event.status === 'ended' || event.status === 'cancelled';
  const canRsvp = !isFull && !isEnded && activeTiers.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        {event.banner_url ? (
          <Image source={{ uri: event.banner_url }} style={styles.banner} resizeMode="cover" />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <Ionicons name="calendar" size={48} color="#334155" />
          </View>
        )}

        <View style={styles.body}>
          {/* Title & Category */}
          <View style={styles.categoryRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{event.category}</Text>
            </View>
            {event.status !== 'published' && (
              <View style={[styles.statusBadge, event.status === 'ended' && styles.endedBadge]}>
                <Text style={styles.statusText}>{event.status.toUpperCase()}</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{event.title}</Text>

          {/* Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar-outline" size={18} color="#f97316" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Date & Time</Text>
                <Text style={styles.infoValue}>{formatDate(event.start_at, true)}</Text>
                <Text style={styles.infoValue}>{formatTime(event.start_at)} – {formatTime(event.end_at)}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="location-outline" size={18} color="#f97316" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{event.location || 'TBA'}</Text>
              </View>
            </View>

            {event.organizer_name && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="person-outline" size={18} color="#f97316" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Organizer</Text>
                  <Text style={styles.infoValue}>{event.organizer_name}</Text>
                </View>
              </View>
            )}

            {event.stats && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="people-outline" size={18} color="#f97316" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Attendance</Text>
                  <Text style={styles.infoValue}>
                    {event.stats.total} registered
                    {event.capacity ? ` / ${event.capacity} capacity` : ''}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Description */}
          {event.description && (
            <>
              <Text style={styles.sectionTitle}>About This Event</Text>
              <Text style={styles.description}>{event.description}</Text>
            </>
          )}

          {/* Ticket Tiers */}
          {activeTiers.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Ticket Tiers</Text>
              <View style={styles.tiersList}>
                {activeTiers.map(tier => (
                  <TierCard key={tier.id} tier={tier} />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Footer Action */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color="#94a3b8" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rsvpBtn, !canRsvp && styles.rsvpBtnDisabled]}
          onPress={() => canRsvp && router.push(`/rsvp/${event.slug}`)}
          disabled={!canRsvp}
        >
          <Text style={styles.rsvpBtnText}>
            {isEnded ? 'Event Ended' : isFull ? 'Event Full' : 'Register Now'}
          </Text>
          {canRsvp && <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  banner: { width: '100%', height: 220 },
  bannerPlaceholder: {
    width: '100%', height: 160, backgroundColor: '#1e293b',
    alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: 20 },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  categoryBadge: { backgroundColor: '#f97316', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  categoryText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusBadge: { backgroundColor: '#1d4ed8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  endedBadge: { backgroundColor: '#374151' },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: '800', color: '#f1f5f9', lineHeight: 32, marginBottom: 20 },
  infoGrid: { gap: 14, marginBottom: 24, backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
  infoItem: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  infoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f97316' + '22', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#f1f5f9', fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginBottom: 12 },
  description: { fontSize: 15, color: '#94a3b8', lineHeight: 24, marginBottom: 24 },
  tiersList: { gap: 10, marginBottom: 24 },
  tierCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b',
    borderRadius: 12, padding: 14, borderLeftWidth: 3, borderWidth: 1, borderColor: '#334155',
  },
  tierName: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  tierDesc: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  tierRemaining: { fontSize: 12, color: '#22c55e', marginTop: 3 },
  tierPrice: { fontSize: 16, fontWeight: '700' },
  footer: {
    flexDirection: 'row', padding: 16, paddingBottom: 28, gap: 12,
    backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b',
  },
  shareBtn: {
    width: 50, height: 50, borderRadius: 12, backgroundColor: '#1e293b',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155',
  },
  rsvpBtn: {
    flex: 1, height: 50, borderRadius: 12, backgroundColor: '#f97316',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  rsvpBtnDisabled: { backgroundColor: '#334155' },
  rsvpBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#94a3b8', fontSize: 16, marginTop: 12 },
});
