import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedTicket, ParticipantProfile } from './types';

const KEYS = {
  SESSION_ID: 'ef_session_id',
  TICKETS: 'ef_tickets',
  PROFILE: 'ef_profile',
};

// Session ID (anonymous participant identity)
export async function getSessionId(): Promise<string> {
  let sid = await AsyncStorage.getItem(KEYS.SESSION_ID);
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await AsyncStorage.setItem(KEYS.SESSION_ID, sid);
  }
  return sid;
}

// Tickets
export async function getSavedTickets(): Promise<SavedTicket[]> {
  const raw = await AsyncStorage.getItem(KEYS.TICKETS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveTicket(ticket: SavedTicket): Promise<void> {
  const tickets = await getSavedTickets();
  const exists = tickets.find(t => t.registration_code === ticket.registration_code);
  if (!exists) {
    tickets.unshift(ticket);
    await AsyncStorage.setItem(KEYS.TICKETS, JSON.stringify(tickets));
  }
}

export async function removeTicket(code: string): Promise<void> {
  const tickets = await getSavedTickets();
  const filtered = tickets.filter(t => t.registration_code !== code);
  await AsyncStorage.setItem(KEYS.TICKETS, JSON.stringify(filtered));
}

// Local profile cache
export async function getCachedProfile(): Promise<Partial<ParticipantProfile>> {
  const raw = await AsyncStorage.getItem(KEYS.PROFILE);
  return raw ? JSON.parse(raw) : {};
}

export async function setCachedProfile(profile: Partial<ParticipantProfile>): Promise<void> {
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}
