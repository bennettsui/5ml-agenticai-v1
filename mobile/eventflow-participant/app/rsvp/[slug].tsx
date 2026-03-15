import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { publicApi } from '../../lib/api';
import { Event, FormField, TicketTier, RSVPRequest } from '../../lib/types';
import { saveTicket } from '../../lib/storage';

const TIER_COLOR_MAP: Record<string, string> = {
  Blue: '#3b82f6', Green: '#22c55e', Orange: '#f97316', Purple: '#a855f7',
  Red: '#ef4444', Yellow: '#eab308', Pink: '#ec4899', Teal: '#14b8a6',
};

function formatPrice(price: number, currency: string): string {
  if (price === 0) return 'Free';
  const sym = currency === 'HKD' ? 'HK$' : currency === 'TWD' ? 'NT$' : currency === 'SGD' ? 'S$' : '$';
  return `${sym}${(price / 100).toFixed(0)}`;
}

interface FormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  organization: string;
  title: string;
  tier_id: number | null;
  notify_whatsapp: boolean;
  notify_line: boolean;
  custom: Record<string, string>;
}

export default function RSVPScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [values, setValues] = useState<FormValues>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    organization: '',
    title: '',
    tier_id: null,
    notify_whatsapp: false,
    notify_line: false,
    custom: {},
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const [{ event }, { fields }] = await Promise.all([
          publicApi.getEvent(slug),
          publicApi.getFormFields(slug),
        ]);
        setEvent(event);
        setFormFields(fields);
        const activeTiers = event.tiers.filter(t => t.is_active);
        if (activeTiers.length === 1) {
          setValues(v => ({ ...v, tier_id: activeTiers[0].id }));
        }
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to load event');
        router.back();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!values.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!values.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!values.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(values.email)) newErrors.email = 'Invalid email address';
    if (!values.tier_id) newErrors.tier_id = 'Please select a ticket tier';

    formFields.forEach(field => {
      if (field.required && !values.custom[field.field_key]?.trim()) {
        newErrors[`custom_${field.field_key}`] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !event) return;
    setSubmitting(true);
    try {
      const data: RSVPRequest = {
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim() || undefined,
        organization: values.organization.trim() || undefined,
        title: values.title.trim() || undefined,
        tier_id: values.tier_id!,
        notify_whatsapp: values.notify_whatsapp,
        notify_line: values.notify_line,
        custom_responses: Object.keys(values.custom).length > 0 ? values.custom : undefined,
      };

      const { attendee } = await publicApi.rsvp(slug, data);

      // Save ticket locally
      await saveTicket({
        registration_code: attendee.registration_code,
        first_name: attendee.first_name,
        last_name: attendee.last_name,
        email: attendee.email,
        tier_name: attendee.tier.name,
        tier_color: 'Orange',
        event_title: attendee.event_title,
        event_start: attendee.event_start,
        event_location: attendee.event_location,
        event_slug: attendee.event_slug,
        saved_at: new Date().toISOString(),
      });

      router.replace(`/ticket/${attendee.registration_code}`);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (key: keyof FormValues, value: unknown) => {
    setValues(v => ({ ...v, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const setCustomField = (key: string, value: string) => {
    setValues(v => ({ ...v, custom: { ...v.custom, [key]: value } }));
    if (errors[`custom_${key}`]) setErrors(e => ({ ...e, [`custom_${key}`]: '' }));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  if (!event) return null;

  const activeTiers = event.tiers.filter(t => t.is_active);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f172a' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Event Summary */}
        <View style={styles.eventSummary}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDate}>
            {new Date(event.start_at).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Ticket Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Ticket</Text>
          {activeTiers.map(tier => {
            const color = TIER_COLOR_MAP[tier.color] || '#f97316';
            const isSoldOut = tier.capacity !== null && tier.sold >= tier.capacity;
            const isSelected = values.tier_id === tier.id;
            return (
              <TouchableOpacity
                key={tier.id}
                style={[styles.tierOption, isSelected && styles.tierOptionSelected, isSoldOut && styles.tierOptionDisabled]}
                onPress={() => !isSoldOut && setField('tier_id', tier.id)}
                disabled={isSoldOut}
              >
                <View style={[styles.tierRadio, isSelected && { borderColor: color, backgroundColor: color }]}>
                  {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tierName}>{tier.name}</Text>
                  {tier.description && <Text style={styles.tierDesc}>{tier.description}</Text>}
                  {isSoldOut && <Text style={styles.soldOut}>Sold out</Text>}
                </View>
                <Text style={[styles.tierPrice, { color }]}>{formatPrice(tier.price, tier.currency)}</Text>
              </TouchableOpacity>
            );
          })}
          {errors.tier_id && <Text style={styles.errorMsg}>{errors.tier_id}</Text>}
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Information</Text>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={[styles.input, errors.first_name && styles.inputError]}
                placeholder="John"
                placeholderTextColor="#475569"
                value={values.first_name}
                onChangeText={v => setField('first_name', v)}
                autoCapitalize="words"
              />
              {errors.first_name && <Text style={styles.errorMsg}>{errors.first_name}</Text>}
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={[styles.input, errors.last_name && styles.inputError]}
                placeholder="Doe"
                placeholderTextColor="#475569"
                value={values.last_name}
                onChangeText={v => setField('last_name', v)}
                autoCapitalize="words"
              />
              {errors.last_name && <Text style={styles.errorMsg}>{errors.last_name}</Text>}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="john@example.com"
              placeholderTextColor="#475569"
              value={values.email}
              onChangeText={v => setField('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorMsg}>{errors.email}</Text>}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+852 9876 5432"
              placeholderTextColor="#475569"
              value={values.phone}
              onChangeText={v => setField('phone', v)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Organization</Text>
            <TextInput
              style={styles.input}
              placeholder="Company / School"
              placeholderTextColor="#475569"
              value={values.organization}
              onChangeText={v => setField('organization', v)}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Job Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Software Engineer"
              placeholderTextColor="#475569"
              value={values.title}
              onChangeText={v => setField('title', v)}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Custom Form Fields */}
        {formFields.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            {formFields.map(field => (
              <View key={field.id} style={styles.fieldGroup}>
                <Text style={styles.label}>
                  {field.label} {field.required ? '*' : ''}
                </Text>
                {field.field_type === 'textarea' ? (
                  <TextInput
                    style={[styles.input, styles.textarea, errors[`custom_${field.field_key}`] && styles.inputError]}
                    placeholder={field.placeholder || ''}
                    placeholderTextColor="#475569"
                    value={values.custom[field.field_key] || ''}
                    onChangeText={v => setCustomField(field.field_key, v)}
                    multiline
                    numberOfLines={4}
                  />
                ) : field.field_type === 'select' && field.options ? (
                  <View style={styles.selectGroup}>
                    {field.options.map(opt => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.selectOption,
                          values.custom[field.field_key] === opt && styles.selectOptionActive,
                        ]}
                        onPress={() => setCustomField(field.field_key, opt)}
                      >
                        <Text style={[
                          styles.selectOptionText,
                          values.custom[field.field_key] === opt && { color: '#fff' },
                        ]}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <TextInput
                    style={[styles.input, errors[`custom_${field.field_key}`] && styles.inputError]}
                    placeholder={field.placeholder || ''}
                    placeholderTextColor="#475569"
                    value={values.custom[field.field_key] || ''}
                    onChangeText={v => setCustomField(field.field_key, v)}
                    keyboardType={field.field_type === 'email' ? 'email-address' : field.field_type === 'phone' ? 'phone-pad' : field.field_type === 'number' ? 'numeric' : 'default'}
                  />
                )}
                {errors[`custom_${field.field_key}`] && (
                  <Text style={styles.errorMsg}>{errors[`custom_${field.field_key}`]}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>WhatsApp Reminders</Text>
              <Text style={styles.switchSub}>Receive event reminders via WhatsApp</Text>
            </View>
            <Switch
              value={values.notify_whatsapp}
              onValueChange={v => setField('notify_whatsapp', v)}
              trackColor={{ true: '#f97316', false: '#334155' }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>LINE Notifications</Text>
              <Text style={styles.switchSub}>Receive event updates via LINE</Text>
            </View>
            <Switch
              value={values.notify_line}
              onValueChange={v => setField('notify_line', v)}
              trackColor={{ true: '#f97316', false: '#334155' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Complete Registration</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  eventSummary: { padding: 20, paddingBottom: 8 },
  eventTitle: { fontSize: 20, fontWeight: '800', color: '#f1f5f9', lineHeight: 26 },
  eventDate: { fontSize: 13, color: '#f97316', marginTop: 4, fontWeight: '500' },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginVertical: 12 },
  row: { flexDirection: 'row', gap: 10 },
  fieldGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 6, letterSpacing: 0.2 },
  input: {
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    color: '#f1f5f9', fontSize: 15,
  },
  inputError: { borderColor: '#ef4444' },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  errorMsg: { fontSize: 12, color: '#ef4444', marginTop: 4 },
  tierOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1e293b', borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#334155',
  },
  tierOptionSelected: { borderColor: '#f97316', backgroundColor: '#f97316' + '12' },
  tierOptionDisabled: { opacity: 0.5 },
  tierRadio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#475569',
    alignItems: 'center', justifyContent: 'center',
  },
  tierName: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  tierDesc: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  soldOut: { fontSize: 12, color: '#ef4444', marginTop: 2 },
  tierPrice: { fontSize: 15, fontWeight: '700' },
  selectGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectOption: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
  },
  selectOptionActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  selectOptionText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  switchLabel: { fontSize: 15, color: '#f1f5f9', fontWeight: '500' },
  switchSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  footer: {
    padding: 16, paddingBottom: 28,
    backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b',
  },
  submitBtn: {
    height: 52, borderRadius: 14, backgroundColor: '#f97316',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
