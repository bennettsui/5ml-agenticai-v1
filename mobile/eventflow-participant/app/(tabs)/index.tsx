import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { publicApi } from '../../lib/api';
import { Event } from '../../lib/types';

const TIER_COLORS: Record<string, string> = {
  Blue: '#3b82f6',
  Green: '#22c55e',
  Orange: '#f97316',
  Purple: '#a855f7',
  Red: '#ef4444',
  Yellow: '#eab308',
  Pink: '#ec4899',
  Teal: '#14b8a6',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatPrice(price: number, currency: string): string {
  if (price === 0) return 'Free';
  const sym = currency === 'HKD' ? 'HK$' : currency === 'TWD' ? 'NT$' : currency === 'SGD' ? 'S$' : '$';
  return `${sym}${(price / 100).toFixed(0)}`;
}

function EventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  const lowestTier = event.tiers
    .filter(t => t.is_active)
    .sort((a, b) => a.price - b.price)[0];

  const isFull = event.capacity !== null && (event.stats?.total ?? 0) >= event.capacity;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {event.banner_url ? (
        <Image source={{ uri: event.banner_url }} style={styles.cardBanner} resizeMode="cover" />
      ) : (
        <View style={styles.cardBannerPlaceholder}>
          <Ionicons name="calendar" size={32} color="#334155" />
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardMeta}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category}</Text>
          </View>
          {isFull && (
            <View style={styles.fullBadge}>
              <Text style={styles.fullText}>FULL</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>
        <View style={styles.cardInfo}>
          <Ionicons name="calendar-outline" size={13} color="#64748b" />
          <Text style={styles.cardInfoText}>{formatDate(event.start_at)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Ionicons name="location-outline" size={13} color="#64748b" />
          <Text style={styles.cardInfoText} numberOfLines={1}>{event.location || 'TBA'}</Text>
        </View>
        {lowestTier && (
          <View style={styles.cardFooter}>
            <Text style={styles.priceText}>
              {formatPrice(lowestTier.price, lowestTier.currency)}
            </Text>
            {event.stats && (
              <Text style={styles.attendeeCount}>{event.stats.total} attending</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const CATEGORIES = ['All', 'Conference', 'Workshop', 'Networking', 'Concert', 'Exhibition', 'Sports', 'Other'];

export default function DiscoverScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchEvents = useCallback(async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      const result = await publicApi.getEvents({
        search: search || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        page: currentPage,
        limit: 10,
      });
      if (reset) {
        setEvents(result.events);
        setPage(1);
      } else {
        setEvents(prev => [...prev, ...result.events]);
      }
      setHasMore(currentPage < result.pages);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [search, selectedCategory, page]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchEvents(true);
  }, [search, selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchEvents(true);
  };

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setPage(p => p + 1);
  };

  useEffect(() => {
    if (page > 1) fetchEvents(false);
  }, [page]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>EventFlow</Text>
          <Text style={styles.headerSubtitle}>Discover events near you</Text>
        </View>
        <View style={styles.orangeDot} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          placeholderTextColor="#475569"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Event List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => router.push(`/event/${item.slug}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#f97316"
              colors={['#f97316']}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color="#f97316" style={{ marginVertical: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color="#334155" />
              <Text style={styles.emptyTitle}>No events found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  orangeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f97316' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#f1f5f9', fontSize: 15 },
  categoryScroll: { maxHeight: 44, marginBottom: 8 },
  categoryContent: { paddingHorizontal: 16, gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryChipActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  categoryChipText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  categoryChipTextActive: { color: '#fff', fontWeight: '600' },
  listContent: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardBanner: { width: '100%', height: 160 },
  cardBannerPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: 14 },
  cardMeta: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  categoryBadge: {
    backgroundColor: '#f97316',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: { color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  fullBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fullText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 8, lineHeight: 22 },
  cardInfo: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  cardInfoText: { fontSize: 13, color: '#64748b', flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  priceText: { fontSize: 15, fontWeight: '700', color: '#f97316' },
  attendeeCount: { fontSize: 12, color: '#64748b' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#f1f5f9', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#64748b', marginTop: 6 },
});
