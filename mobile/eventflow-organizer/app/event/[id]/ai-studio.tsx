import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Modal, Clipboard,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { aiApi } from '../../../lib/api';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Tool {
  key: string;
  title: string;
  desc: string;
  icon: IconName;
  color: string;
  action: () => Promise<string>;
}

export default function AIStudioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ title: string; content: string } | null>(null);
  const [socialPlatform, setSocialPlatform] = useState<'instagram' | 'linkedin' | 'twitter'>('instagram');

  const eventId = Number(id);

  const tools: Tool[] = [
    {
      key: 'describe',
      title: 'Event Description',
      desc: 'Generate a compelling event description with AI',
      icon: 'document-text-outline',
      color: '#3b82f6',
      action: async () => {
        const { description } = await aiApi.describe(eventId);
        return description;
      },
    },
    {
      key: 'social',
      title: 'Social Media Post',
      desc: 'Create engaging posts for Instagram, LinkedIn, or Twitter',
      icon: 'share-social-outline',
      color: '#a855f7',
      action: async () => {
        const { post } = await aiApi.social(eventId, socialPlatform);
        return post;
      },
    },
    {
      key: 'agenda',
      title: 'Event Agenda',
      desc: 'Generate a detailed event schedule and agenda',
      icon: 'list-outline',
      color: '#22c55e',
      action: async () => {
        const { agenda } = await aiApi.agenda(eventId);
        return agenda;
      },
    },
    {
      key: 'email',
      title: 'Promotional Email',
      desc: 'Write a professional email to promote your event',
      icon: 'mail-outline',
      color: '#f97316',
      action: async () => {
        const { email } = await aiApi.email(eventId);
        return email;
      },
    },
    {
      key: 'banner-prompt',
      title: 'Banner Image Prompt',
      desc: 'Generate a DALL-E / Midjourney prompt for your event banner',
      icon: 'image-outline',
      color: '#eab308',
      action: async () => {
        const { prompt } = await aiApi.bannerPrompt(eventId);
        return prompt;
      },
    },
  ];

  const run = async (tool: Tool) => {
    setLoading(tool.key);
    try {
      const content = await tool.action();
      setResult({ title: tool.title, content });
    } catch (err: any) {
      Alert.alert('AI Error', err.message || 'Failed to generate content');
    } finally {
      setLoading(null);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      Clipboard.setString(result.content);
      Alert.alert('Copied!', 'Content copied to clipboard');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={24} color="#eab308" />
          </View>
          <Text style={styles.headerTitle}>AI Studio</Text>
          <Text style={styles.headerSub}>Generate content for your event with AI</Text>
        </View>

        {/* Social Platform for social tool */}
        <View style={styles.platformRow}>
          <Text style={styles.platformLabel}>Social Platform</Text>
          <View style={styles.platformPicker}>
            {(['instagram', 'linkedin', 'twitter'] as const).map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.platformChip, socialPlatform === p && styles.platformChipActive]}
                onPress={() => setSocialPlatform(p)}
              >
                <Text style={[styles.platformChipText, socialPlatform === p && { color: '#fff' }]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tools */}
        {tools.map(tool => (
          <TouchableOpacity
            key={tool.key}
            style={styles.toolCard}
            onPress={() => run(tool)}
            disabled={loading !== null}
            activeOpacity={0.8}
          >
            <View style={[styles.toolIcon, { backgroundColor: tool.color + '22' }]}>
              {loading === tool.key ? (
                <ActivityIndicator size="small" color={tool.color} />
              ) : (
                <Ionicons name={tool.icon} size={22} color={tool.color} />
              )}
            </View>
            <View style={styles.toolBody}>
              <Text style={styles.toolTitle}>{tool.title}</Text>
              <Text style={styles.toolDesc}>{tool.desc}</Text>
            </View>
            {loading === tool.key ? (
              <Text style={[styles.generatingText, { color: tool.color }]}>Generating...</Text>
            ) : (
              <Ionicons name="chevron-forward" size={16} color="#475569" />
            )}
          </TouchableOpacity>
        ))}

        {/* Model Info */}
        <View style={styles.modelInfo}>
          <Ionicons name="information-circle-outline" size={14} color="#475569" />
          <Text style={styles.modelInfoText}>
            Powered by DeepSeek Reasoner with Claude Haiku fallback
          </Text>
        </View>
      </ScrollView>

      {/* Result Modal */}
      <Modal visible={!!result} animationType="slide" presentationStyle="pageSheet">
        {result && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{result.title}</Text>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard}>
                  <Ionicons name="copy-outline" size={18} color="#f97316" />
                  <Text style={styles.copyBtnText}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setResult(null)}>
                  <Ionicons name="close" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
              <Text style={styles.resultText}>{result.content}</Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.regenerateBtn} onPress={() => {
                const tool = tools.find(t => t.title === result.title);
                if (tool) { setResult(null); run(tool); }
              }}>
                <Ionicons name="refresh" size={16} color="#fff" />
                <Text style={styles.regenerateBtnText}>Regenerate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doneBtn} onPress={() => setResult(null)}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  list: { padding: 20, gap: 12 },
  header: { alignItems: 'center', marginBottom: 8 },
  headerIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#eab308' + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#f1f5f9' },
  headerSub: { fontSize: 14, color: '#64748b', marginTop: 4, textAlign: 'center' },
  platformRow: { backgroundColor: '#1e293b', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#334155' },
  platformLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginBottom: 10 },
  platformPicker: { flexDirection: 'row', gap: 8 },
  platformChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  platformChipActive: { backgroundColor: '#a855f7', borderColor: '#a855f7' },
  platformChipText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  toolCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
  toolIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toolBody: { flex: 1 },
  toolTitle: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  toolDesc: { fontSize: 13, color: '#64748b', marginTop: 3 },
  generatingText: { fontSize: 12, fontWeight: '600' },
  modelInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 8 },
  modelInfoText: { fontSize: 12, color: '#475569' },
  modal: { flex: 1, backgroundColor: '#0f172a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#f1f5f9', flex: 1 },
  modalHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  copyBtnText: { color: '#f97316', fontSize: 14, fontWeight: '600' },
  resultText: { fontSize: 15, color: '#e2e8f0', lineHeight: 26 },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 28, borderTopWidth: 1, borderTopColor: '#1e293b' },
  regenerateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 12, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  regenerateBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  doneBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center' },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
