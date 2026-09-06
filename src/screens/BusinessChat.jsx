import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../theme';
import { API_KEY, DB_URL } from '../config/Firebase';

// ── Fetch all applicants who applied to this business ─────────
const fetchApplicants = async (businessUid) => {
  const res  = await fetch(`${DB_URL}/applications?key=${API_KEY}&pageSize=200`);
  const data = await res.json();
  if (!data.documents) return [];

  const seen = new Set();
  return data.documents
    .map((doc) => {
      const f = doc.fields || {};
      return {
        studentId:       f.studentId?.stringValue       || '',
        studentName:     f.studentName?.stringValue      || '',
        studentEmail:    f.studentEmail?.stringValue     || '',
        internshipTitle: f.internshipTitle?.stringValue  || '',
        company:         f.company?.stringValue          || '',
        appliedAt:       f.appliedAt?.stringValue        || '',
      };
    })
    .filter((a) => {
      // Keep unique students only — deduplicate by studentId
      if (!a.studentId || seen.has(a.studentId)) return false;
      seen.add(a.studentId);
      return true;
    });
};

// ── Fetch messages for a chat room ────────────────────────────
const fetchMessages = async (chatId) => {
  const res  = await fetch(
    `${DB_URL}/chats/${chatId}/messages?key=${API_KEY}&pageSize=200`
  );
  const data = await res.json();
  if (!data.documents) return [];

  return data.documents
    .map((doc) => {
      const f  = doc.fields || {};
      const id = doc.name.split('/').pop();
      return {
        id,
        text:       f.text?.stringValue       || '',
        senderId:   f.senderId?.stringValue   || '',
        senderName: f.senderName?.stringValue || '',
        sentAt:     f.sentAt?.stringValue     || '',
      };
    })
    .sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
};

// ── Send a message ────────────────────────────────────────────
const sendMessage = async (chatId, sender, text) => {
  const docId  = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const fields = {
    text:       { stringValue: text.trim()         },
    senderId:   { stringValue: sender?.uid   || '' },
    senderName: { stringValue: sender?.name  || '' },
    sentAt:     { stringValue: new Date().toISOString() },
  };
  const res = await fetch(
    `${DB_URL}/chats/${chatId}/messages/${docId}?key=${API_KEY}`,
    {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fields }),
    }
  );
  if (!res.ok) throw new Error('Failed to send message');
};

// ── Format time ───────────────────────────────────────────────
const formatTime = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
};

// ── Message bubble ────────────────────────────────────────────
function Bubble({ msg, isMe }) {
  return (
    <View style={[styles.bubbleWrap, isMe && styles.bubbleWrapMe]}>
      {!isMe && (
        <View style={styles.bubbleAvatar}>
          <Text style={styles.bubbleAvatarText}>
            {(msg.senderName || 'S').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={[styles.bubble, isMe && styles.bubbleMe]}>
        {!isMe && (
          <Text style={styles.bubbleSender}>{msg.senderName}</Text>
        )}
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
          {msg.text}
        </Text>
        <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
          {formatTime(msg.sentAt)}
        </Text>
      </View>
    </View>
  );
}

// ── Chat Room ─────────────────────────────────────────────────
function ChatRoom({ user, chatId, partnerName, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const listRef = useRef(null);

  const load = async () => {
    try {
      const msgs = await fetchMessages(chatId);
      setMessages(msgs);
    } catch (e) {
      console.log('Fetch messages error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [chatId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const draft = text.trim();
    setText('');
    setSending(true);
    try {
      await sendMessage(chatId, user, draft);
      await load();
    } catch (e) {
      setText(draft); // restore on failure
      console.log('Send error:', e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <View style={styles.chatHeaderAvatar}>
          <Text style={styles.chatHeaderAvatarText}>
            {partnerName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: SPACING.sm }}>
          <Text style={styles.chatHeaderName}>{partnerName}</Text>
          <View style={styles.onlineDot} />
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.gold} size="large" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.msgList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatEmoji}>👋</Text>
              <Text style={styles.emptyChatTitle}>Start the conversation</Text>
              <Text style={styles.emptyChatSub}>
                Say hello to {partnerName}!{'\n'}Type a message below to get started.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Bubble msg={item} isMe={item.senderId === user?.uid} />
          )}
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.msgInput}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textHint}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnOff]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            activeOpacity={0.85}>
            {sending
              ? <ActivityIndicator color={COLORS.bg} size="small" />
              : <Text style={styles.sendIcon}>➤</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Applicant List ────────────────────────────────────────────
export default function BusinessChat({ user, onBack }) {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeChatId, setActive]   = useState(null);
  const [partnerName, setPartner]   = useState('');

  const load = async () => {
    try {
      const data = await fetchApplicants(user?.uid);
      setApplicants(data);
    } catch (e) {
      console.log('Fetch applicants error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const openChat = (student) => {
    // Chat ID = sorted UIDs joined — same for both sides
    const chatId = [user?.uid, student.studentId].sort().join('_');
    setActive(chatId);
    setPartner(student.studentName || 'Student');
  };

  // Show chat room
  if (activeChatId) {
    return (
      <ChatRoom
        user={user}
        chatId={activeChatId}
        partnerName={partnerName}
        onBack={() => { setActive(null); setPartner(''); }}
      />
    );
  }

  // Show applicant list
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.listHeader}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.listTitle}>Messages</Text>
        <TouchableOpacity onPress={() => { setRefreshing(true); load(); }} activeOpacity={0.7}>
          <Text style={styles.refreshBtn}>↻</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.gold} size="large" />
          <Text style={styles.loadingText}>Loading applicants...</Text>
        </View>
      ) : (
        <FlatList
          data={applicants}
          keyExtractor={(a) => a.studentId}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor={COLORS.gold} colors={[COLORS.gold]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyTitle}>No applicants yet</Text>
              <Text style={styles.emptySub}>
                When students apply to your internships,{'\n'}you can chat with them here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => openChat(item)}
              activeOpacity={0.85}>
              <View style={styles.itemAvatar}>
                <Text style={styles.itemAvatarText}>
                  {(item.studentName || 'S').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={styles.itemName}>{item.studentName || 'Unknown Student'}</Text>
                <Text style={styles.itemSub} numberOfLines={1}>
                  Applied for: {item.internshipTitle}
                </Text>
              </View>
              <Text style={styles.listArrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: COLORS.bg },

  // List
  listHeader:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  listTitle:          { fontSize: 17, fontWeight: '700', color: COLORS.textPri },
  back:               { fontSize: 16, color: COLORS.gold },
  refreshBtn:         { fontSize: 20, color: COLORS.gold },
  listItem:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  itemAvatar:         { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  itemAvatarText:     { fontSize: 20, fontWeight: '700', color: COLORS.bg },
  itemName:           { fontSize: 15, fontWeight: '600', color: COLORS.textPri, marginBottom: 3 },
  itemSub:            { fontSize: 12, color: COLORS.textSec },
  listArrow:          { fontSize: 22, color: COLORS.textSec },
  loadingWrap:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText:        { fontSize: 14, color: COLORS.textSec },
  emptyState:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, paddingHorizontal: SPACING.lg },
  emptyEmoji:         { fontSize: 56, marginBottom: 16 },
  emptyTitle:         { fontSize: 20, fontWeight: '700', color: COLORS.textPri, marginBottom: 8 },
  emptySub:           { fontSize: 14, color: COLORS.textSec, textAlign: 'center', lineHeight: 22 },

  // Chat header
  chatHeader:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  backBtn:            { marginRight: SPACING.sm },
  chatHeaderAvatar:   { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  chatHeaderAvatarText:{ fontSize: 15, fontWeight: '700', color: COLORS.bg },
  chatHeaderName:     { fontSize: 15, fontWeight: '600', color: COLORS.textPri },
  onlineDot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success, marginTop: 3 },

  // Messages
  msgList:            { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, flexGrow: 1 },
  bubbleWrap:         { flexDirection: 'row', alignItems: 'flex-end', marginBottom: SPACING.sm },
  bubbleWrapMe:       { flexDirection: 'row-reverse' },
  bubbleAvatar:       { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', marginRight: 6, marginBottom: 2 },
  bubbleAvatarText:   { fontSize: 12, fontWeight: '700', color: COLORS.bg },
  bubble:             { backgroundColor: COLORS.card, borderRadius: 18, borderBottomLeftRadius: 4, padding: SPACING.sm, maxWidth: '75%', borderWidth: 0.5, borderColor: COLORS.border },
  bubbleMe:           { backgroundColor: COLORS.gold, borderBottomLeftRadius: 18, borderBottomRightRadius: 4, borderColor: COLORS.goldDark, marginRight: 0 },
  bubbleSender:       { fontSize: 11, color: COLORS.gold, fontWeight: '600', marginBottom: 2 },
  bubbleText:         { fontSize: 14, color: COLORS.textPri, lineHeight: 20 },
  bubbleTextMe:       { color: COLORS.bg },
  bubbleTime:         { fontSize: 10, color: COLORS.textSec, marginTop: 4, alignSelf: 'flex-end' },
  bubbleTimeMe:       { color: 'rgba(10,10,20,0.5)' },
  emptyChat:          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: SPACING.xl },
  emptyChatEmoji:     { fontSize: 56, marginBottom: 16 },
  emptyChatTitle:     { fontSize: 18, fontWeight: '700', color: COLORS.textPri, marginBottom: 8, textAlign: 'center' },
  emptyChatSub:       { fontSize: 13, color: COLORS.textSec, textAlign: 'center', lineHeight: 20 },

  // Input
  inputRow:           { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderTopWidth: 0.5, borderTopColor: COLORS.border, backgroundColor: COLORS.card, gap: SPACING.sm },
  msgInput:           { flex: 1, backgroundColor: COLORS.bg, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 22, paddingHorizontal: SPACING.md, paddingVertical: 10, fontSize: 15, color: COLORS.textPri, maxHeight: 100 },
  sendBtn:            { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff:         { backgroundColor: COLORS.border },
  sendIcon:           { fontSize: 17, color: COLORS.bg },
});