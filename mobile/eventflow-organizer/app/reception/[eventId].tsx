import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, Alert, ActivityIndicator, Vibration,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { checkinApi } from '../../lib/api';
import { CheckinAttendee, EventStats } from '../../lib/types';

type Tab = 'scan' | 'search';

interface CheckinResult {
  attendee: CheckinAttendee;
  status: 'success' | 'already' | 'error';
  message: string;
  timestamp: number;
}

export default function ReceptionKioskScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [tab, setTab] = useState<Tab>('scan');
  const [scanning, setScanning] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<CheckinAttendee[]>([]);
  const [searching, setSearching] = useState(false);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<CheckinResult[]>([]);
  const [lastResult, setLastResult] = useState<CheckinResult | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const cooldownRef = useRef(false);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const { stats } = await checkinApi.getStats(Number(eventId));
      setStats(stats);
    } catch {}
  }, [eventId]);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [loadStats]);

  // Handle QR scan
  const handleBarcodeScan = async ({ data }: { data: string }) => {
    if (cooldownRef.current || checkingIn) return;
    cooldownRef.current = true;
    setScanning(false);

    // Extract code from QR data - could be a URL or raw UUID
    let code = data;
    if (data.includes('/eventflow/')) {
      const parts = data.split('/');
      code = parts[parts.length - 1].split('?')[0];
      if (code.includes('code=')) code = new URLSearchParams(code).get('code') || code;
    }

    setCheckingIn(true);
    try {
      // First get attendee info
      const { attendee } = await checkinApi.scan(code);

      if (attendee.status === 'checked_in') {
        const result: CheckinResult = {
          attendee,
          status: 'already',
          message: 'Already checked in',
          timestamp: Date.now(),
        };
        setLastResult(result);
        setRecentCheckins(prev => [result, ...prev.slice(0, 9)]);
        Vibration.vibrate([100, 50, 100]);
      } else {
        // Check in
        const { attendee: checkedIn } = await checkinApi.checkin(attendee.id);
        const result: CheckinResult = {
          attendee: checkedIn,
          status: 'success',
          message: 'Checked in successfully!',
          timestamp: Date.now(),
        };
        setLastResult(result);
        setRecentCheckins(prev => [result, ...prev.slice(0, 9)]);
        Vibration.vibrate(200);
        await loadStats();
      }
    } catch (err: any) {
      const result: CheckinResult = {
        attendee: { id: 0, first_name: 'Unknown', last_name: '', email: '', organization: null, status: 'registered', tier_name: '', tier_color: '', checked_in_at: null },
        status: 'error',
        message: err.message || 'Invalid QR code',
        timestamp: Date.now(),
      };
      setLastResult(result);
      Vibration.vibrate([100, 100, 100, 100, 100]);
    } finally {
      setCheckingIn(false);
      // Re-enable scan after 2 seconds
      setTimeout(() => {
        cooldownRef.current = false;
        setScanning(true);
        setLastResult(null);
      }, 2500);
    }
  };

  // Handle manual checkin
  const handleManualCheckin = async (attendee: CheckinAttendee) => {
    if (attendee.status === 'checked_in') {
      Alert.alert('Already Checked In', `${attendee.first_name} ${attendee.last_name} is already checked in.`);
      return;
    }
    setCheckingIn(true);
    try {
      const { attendee: updated } = await checkinApi.checkin(attendee.id);
      Alert.alert('✅ Checked In', `${updated.first_name} ${updated.last_name} checked in successfully!`);
      setSearchResults(prev => prev.map(a => a.id === updated.id ? updated : a));
      Vibration.vibrate(200);
      await loadStats();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setCheckingIn(false);
    }
  };

  // Search attendees
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { attendees } = await checkinApi.search(Number(eventId), search);
        setSearchResults(attendees);
      } catch {}
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [search, eventId]);

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#334155" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionSub}>EventFlow needs camera access to scan QR codes</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => { setTab('search'); }}>
          <Text style={styles.backBtnText}>Use Manual Search Instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const checkinRate = stats ? Math.round((stats.checked_in / (stats.total || 1)) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <TouchableOpacity style={styles.backNavBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#94a3b8" />
        </TouchableOpacity>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{stats?.total || 0}</Text>
          <Text style={styles.statLbl}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#22c55e' }]}>{stats?.checked_in || 0}</Text>
          <Text style={styles.statLbl}>Checked In</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{checkinRate}%</Text>
          <Text style={styles.statLbl}>Rate</Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'scan' && styles.tabBtnActive]}
          onPress={() => setTab('scan')}
        >
          <Ionicons name="scan-outline" size={16} color={tab === 'scan' ? '#22c55e' : '#64748b'} />
          <Text style={[styles.tabBtnText, tab === 'scan' && styles.tabBtnTextActive]}>QR Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'search' && styles.tabBtnActive]}
          onPress={() => setTab('search')}
        >
          <Ionicons name="search-outline" size={16} color={tab === 'search' ? '#22c55e' : '#64748b'} />
          <Text style={[styles.tabBtnText, tab === 'search' && styles.tabBtnTextActive]}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* QR Scanner Tab */}
      {tab === 'scan' && (
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanning && !checkingIn ? handleBarcodeScan : undefined}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />

          {/* Scanner Overlay */}
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.scannerHint}>
              {checkingIn ? 'Processing...' : 'Point camera at attendee QR code'}
            </Text>
          </View>

          {/* Result Overlay */}
          {lastResult && (
            <View style={[
              styles.resultOverlay,
              lastResult.status === 'success' && styles.resultSuccess,
              lastResult.status === 'already' && styles.resultWarning,
              lastResult.status === 'error' && styles.resultError,
            ]}>
              <Ionicons
                name={lastResult.status === 'success' ? 'checkmark-circle' : lastResult.status === 'already' ? 'time' : 'close-circle'}
                size={32}
                color="#fff"
              />
              <Text style={styles.resultName}>
                {lastResult.status !== 'error' ? `${lastResult.attendee.first_name} ${lastResult.attendee.last_name}` : ''}
              </Text>
              <Text style={styles.resultMsg}>{lastResult.message}</Text>
              {lastResult.status !== 'error' && (
                <Text style={styles.resultTier}>{lastResult.attendee.tier_name}</Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Search Tab */}
      {tab === 'search' && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInput}>
            <Ionicons name="search" size={16} color="#64748b" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Search by name or email..."
              placeholderTextColor="#475569"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            {searching && <ActivityIndicator size="small" color="#f97316" />}
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.attendeeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attendeeName}>{item.first_name} {item.last_name}</Text>
                  <Text style={styles.attendeeEmail}>{item.email}</Text>
                  <Text style={styles.attendeeTier}>{item.tier_name}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.checkinBtn,
                    item.status === 'checked_in' && styles.checkinBtnDone,
                  ]}
                  onPress={() => handleManualCheckin(item)}
                  disabled={item.status === 'checked_in' || checkingIn}
                >
                  <Ionicons
                    name={item.status === 'checked_in' ? 'checkmark' : 'scan'}
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.checkinBtnText}>
                    {item.status === 'checked_in' ? 'Done' : 'Check In'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              search.length > 0 && !searching ? (
                <View style={styles.emptySearch}>
                  <Text style={styles.emptySearchText}>No attendees found for "{search}"</Text>
                </View>
              ) : null
            }
          />

          {/* Recent Checkins */}
          {recentCheckins.length > 0 && search.length === 0 && (
            <View style={styles.recentSection}>
              <Text style={styles.recentTitle}>Recent Check-ins</Text>
              {recentCheckins.slice(0, 5).map((r, i) => (
                <View key={i} style={styles.recentRow}>
                  <View style={[styles.recentDot, r.status === 'success' ? styles.recentDotSuccess : styles.recentDotWarning]} />
                  <Text style={styles.recentName}>{r.attendee.first_name} {r.attendee.last_name}</Text>
                  <Text style={styles.recentStatus}>{r.message}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  permissionContainer: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', padding: 32 },
  permissionTitle: { fontSize: 22, fontWeight: '700', color: '#f1f5f9', marginTop: 16 },
  permissionSub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8 },
  permissionBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 14, backgroundColor: '#22c55e', borderRadius: 12 },
  permissionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backBtn: { marginTop: 12 },
  backBtnText: { color: '#64748b', fontSize: 14 },
  statsBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  backNavBtn: { padding: 4, marginRight: 8 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: '#f1f5f9' },
  statLbl: { fontSize: 10, color: '#64748b', marginTop: 1 },
  statDivider: { width: 1, height: 30, backgroundColor: '#334155' },
  tabBar: { flexDirection: 'row', padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  tabBtnActive: { backgroundColor: '#22c55e' + '22', borderColor: '#22c55e' + '55' },
  tabBtnText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  tabBtnTextActive: { color: '#22c55e' },
  scannerContainer: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scannerFrame: { width: 240, height: 240, position: 'relative' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#22c55e', borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scannerHint: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 200, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  resultOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, alignItems: 'center', gap: 6 },
  resultSuccess: { backgroundColor: 'rgba(34, 197, 94, 0.92)' },
  resultWarning: { backgroundColor: 'rgba(245, 158, 11, 0.92)' },
  resultError: { backgroundColor: 'rgba(239, 68, 68, 0.92)' },
  resultName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  resultMsg: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  resultTier: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  searchContainer: { flex: 1 },
  searchInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', margin: 16, borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#334155' },
  searchTextInput: { flex: 1, color: '#f1f5f9', fontSize: 15 },
  attendeeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#334155' },
  attendeeName: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  attendeeEmail: { fontSize: 13, color: '#64748b', marginTop: 2 },
  attendeeTier: { fontSize: 12, color: '#f97316', marginTop: 2 },
  checkinBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#22c55e', borderRadius: 10 },
  checkinBtnDone: { backgroundColor: '#334155' },
  checkinBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  emptySearch: { alignItems: 'center', paddingVertical: 24 },
  emptySearchText: { color: '#64748b', fontSize: 14 },
  recentSection: { padding: 16, borderTopWidth: 1, borderTopColor: '#1e293b' },
  recentTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  recentDot: { width: 8, height: 8, borderRadius: 4 },
  recentDotSuccess: { backgroundColor: '#22c55e' },
  recentDotWarning: { backgroundColor: '#f59e0b' },
  recentName: { flex: 1, fontSize: 14, color: '#f1f5f9', fontWeight: '500' },
  recentStatus: { fontSize: 12, color: '#64748b' },
});
