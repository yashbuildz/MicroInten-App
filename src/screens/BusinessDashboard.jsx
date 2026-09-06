import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl,
  StatusBar, Platform,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../theme';
import { API_KEY, DB_URL } from '../config/Firebase';
import BusinessChat    from './BusinessChat';
import BusinessProfile from './BusinessProfile';

const NAV_TABS = [
  { key: 'home',       label: 'Home',       emoji: '🏠' },
  { key: 'post',       label: 'Post',       emoji: '➕' },
  { key: 'candidates', label: 'Candidates', emoji: '👥' },
  { key: 'chat',       label: 'Chat',       emoji: '💬' },
  { key: 'profile',    label: 'Profile',    emoji: '🏢' },
];

// ── Fetch real postings ────────────────────────────────────────
const fetchPostings = async () => {
  const res  = await fetch(`${DB_URL}/internships?key=${API_KEY}&pageSize=100`);
  const data = await res.json();
  if (!data.documents) return [];
  return data.documents.map((doc) => {
    const f  = doc.fields || {};
    const id = doc.name.split('/').pop();
    return {
      id,
      title:      f.title?.stringValue      || 'Untitled',
      skills:     f.skills?.stringValue     || '',
      duration:   f.duration?.stringValue   || '',
      stipend:    f.stipend?.stringValue     || '',
      status:     f.status?.stringValue     || 'Active',
      applicants: f.applicants?.integerValue || 0,
      createdAt:  f.createdAt?.stringValue  || '',
    };
  });
};

// ── Fetch real applicants ──────────────────────────────────────
const fetchApplicants = async () => {
  const res  = await fetch(`${DB_URL}/applications?key=${API_KEY}&pageSize=100`);
  const data = await res.json();
  if (!data.documents) return [];
  return data.documents.map((doc) => {
    const f  = doc.fields || {};
    const id = doc.name.split('/').pop();
    return {
      id,
      studentId:       f.studentId?.stringValue       || '',
      studentName:     f.studentName?.stringValue      || '',
      studentEmail:    f.studentEmail?.stringValue     || '',
      phone:           f.phone?.stringValue            || '',
      internshipTitle: f.internshipTitle?.stringValue  || '',
      company:         f.company?.stringValue          || '',
      coverLetter:     f.coverLetter?.stringValue      || '',
      whyUs:           f.whyUs?.stringValue            || '',
      experience:      f.experience?.stringValue       || '',
      availability:    f.availability?.stringValue     || '',
      status:          f.status?.stringValue           || 'Applied',
      appliedAt:       f.appliedAt?.stringValue        || '',
    };
  });
};

// ── Update applicant status ────────────────────────────────────
const updateStatus = async (docId, status) => {
  const fields = { status: { stringValue: status } };
  await fetch(`${DB_URL}/applications/${docId}?key=${API_KEY}&updateMask.fieldPaths=status`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fields }),
  });
};

// ── Post Form ──────────────────────────────────────────────────
function PostForm({ onPosted }) {
  const [title, setTitle]       = useState('');
  const [skills, setSkills]     = useState('');
  const [duration, setDuration] = useState('');
  const [stipend, setStipend]   = useState('');
  const [desc, setDesc]         = useState('');
  const [loading, setLoading]   = useState(false);

  const handlePost = async () => {
    if (!title.trim() || !skills.trim() || !duration.trim()) {
      Alert.alert('Missing fields', 'Title, skills and duration are required.');
      return;
    }
    setLoading(true);
    try {
      const docId  = 'post_' + Date.now();
      const fields = {
        title:       { stringValue: title.trim()    },
        skills:      { stringValue: skills.trim()   },
        duration:    { stringValue: duration.trim() },
        stipend:     { stringValue: stipend.trim()  },
        description: { stringValue: desc.trim()     },
        status:      { stringValue: 'Active'        },
        applicants:  { integerValue: 0              },
        createdAt:   { stringValue: new Date().toISOString() },
      };
      const res = await fetch(`${DB_URL}/internships/${docId}?key=${API_KEY}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fields }),
      });
      if (!res.ok) throw new Error('Post failed');
      Alert.alert('Posted!', 'Your internship is now live.');
      setTitle(''); setSkills(''); setDuration(''); setStipend(''); setDesc('');
      onPosted?.();
    } catch {
      Alert.alert('Error', 'Failed to post. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <Text style={styles.formTitle}>Post a New Internship</Text>
      <Text style={styles.label}>Job title *</Text>
      <TextInput style={styles.input} placeholder="e.g. UI/UX Design Intern"
        placeholderTextColor={COLORS.textHint} value={title} onChangeText={setTitle} />
      <Text style={styles.label}>Required skills *</Text>
      <TextInput style={styles.input} placeholder="e.g. Figma, React Native, Python"
        placeholderTextColor={COLORS.textHint} value={skills} onChangeText={setSkills} />
      <Text style={styles.label}>Duration *</Text>
      <TextInput style={styles.input} placeholder="e.g. 4 weeks"
        placeholderTextColor={COLORS.textHint} value={duration} onChangeText={setDuration} />
      <Text style={styles.label}>Stipend (optional)</Text>
      <TextInput style={styles.input} placeholder="e.g. 5000/month"
        placeholderTextColor={COLORS.textHint} value={stipend} onChangeText={setStipend} />
      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, styles.textArea]}
        placeholder="Describe the role and responsibilities..."
        placeholderTextColor={COLORS.textHint} value={desc} onChangeText={setDesc}
        multiline numberOfLines={4} textAlignVertical="top" />
      <TouchableOpacity style={[styles.postBtn, loading && { opacity: 0.7 }]}
        onPress={handlePost} disabled={loading} activeOpacity={0.85}>
        {loading ? <ActivityIndicator color={COLORS.bg} /> :
          <Text style={styles.postBtnText}>Post Internship</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Candidate detail sheet ─────────────────────────────────────
function CandidateDetail({ candidate, onClose, onStatusChange }) {
  const [loading, setLoading] = useState(false);

  const changeStatus = async (status) => {
    setLoading(true);
    try {
      await updateStatus(candidate.id, status);
      onStatusChange(candidate.id, status);
      Alert.alert('Updated', `Status changed to ${status}`);
    } catch {
      Alert.alert('Error', 'Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  const STATUS_COLORS = {
    'Applied':      COLORS.textSec,
    'Under Review': COLORS.warning,
    'Shortlisted':  COLORS.success,
    'Rejected':     COLORS.error,
    'Hired':        COLORS.gold,
  };

  return (
    <View style={styles.detailOverlay}>
      <TouchableOpacity style={styles.detailBg} onPress={onClose} activeOpacity={1} />
      <View style={styles.detailSheet}>
        <View style={styles.detailHeader}>
          <View style={styles.detailAvatar}>
            <Text style={styles.detailAvatarText}>
              {(candidate.studentName || 'S').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={styles.detailName}>{candidate.studentName}</Text>
            <Text style={styles.detailEmail}>{candidate.studentEmail}</Text>
            {candidate.phone ? <Text style={styles.detailPhone}>📞 {candidate.phone}</Text> : null}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Applied for</Text>
            <Text style={styles.detailValue}>{candidate.internshipTitle}</Text>
          </View>

          {candidate.whyUs ? (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Why this internship?</Text>
              <Text style={styles.detailValue}>{candidate.whyUs}</Text>
            </View>
          ) : null}

          {candidate.experience ? (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Experience</Text>
              <Text style={styles.detailValue}>{candidate.experience}</Text>
            </View>
          ) : null}

          {candidate.coverLetter ? (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Cover Letter</Text>
              <Text style={styles.detailValue}>{candidate.coverLetter}</Text>
            </View>
          ) : null}

          {candidate.availability ? (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Available from</Text>
              <Text style={styles.detailValue}>{candidate.availability}</Text>
            </View>
          ) : null}

          <Text style={styles.detailSectionTitle}>Update Status</Text>
          <View style={styles.statusGrid}>
            {['Under Review', 'Shortlisted', 'Hired', 'Rejected'].map((s) => (
              <TouchableOpacity key={s}
                style={[styles.statusBtn, { borderColor: STATUS_COLORS[s] },
                  candidate.status === s && { backgroundColor: STATUS_COLORS[s] + '22' }]}
                onPress={() => changeStatus(s)} disabled={loading} activeOpacity={0.8}>
                <Text style={[styles.statusBtnText, { color: STATUS_COLORS[s] }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ── Candidates Tab ─────────────────────────────────────────────
function CandidatesTab() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected]     = useState(null);

  const load = async () => {
    try {
      const data = await fetchApplicants();
      setCandidates(data);
    } catch { setCandidates([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const onStatusChange = (id, status) => {
    setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
    setSelected((prev) => prev?.id === id ? { ...prev, status } : prev);
  };

  const STATUS_COLORS = {
    'Applied':      COLORS.textSec,
    'Under Review': COLORS.warning,
    'Shortlisted':  COLORS.success,
    'Rejected':     COLORS.error,
    'Hired':        COLORS.gold,
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={COLORS.gold} colors={[COLORS.gold]} />
        }>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Applicants</Text>
            <TouchableOpacity onPress={() => { setLoading(true); load(); }}>
              <Text style={styles.refreshLink}>↻ Refresh</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.gold} style={{ marginVertical: 30 }} />
          ) : candidates.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyBoxEmoji}>👥</Text>
              <Text style={styles.emptyBoxTitle}>No applicants yet</Text>
              <Text style={styles.emptyBoxSub}>When students apply, they'll appear here.</Text>
            </View>
          ) : (
            candidates.map((c) => (
              <TouchableOpacity key={c.id} style={styles.candidateCard}
                onPress={() => setSelected(c)} activeOpacity={0.85}>
                <View style={styles.candidateAvatar}>
                  <Text style={styles.candidateAvatarText}>
                    {(c.studentName || 'S').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: SPACING.md }}>
                  <Text style={styles.candidateName}>{c.studentName}</Text>
                  <Text style={styles.candidateRole} numberOfLines={1}>{c.internshipTitle}</Text>
                  {c.appliedAt ? (
                    <Text style={styles.candidateDate}>
                      {new Date(c.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.statusPill, { borderColor: STATUS_COLORS[c.status] || COLORS.textSec }]}>
                  <Text style={[styles.statusPillText, { color: STATUS_COLORS[c.status] || COLORS.textSec }]}>
                    {c.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {selected && (
        <CandidateDetail
          candidate={selected}
          onClose={() => setSelected(null)}
          onStatusChange={onStatusChange}
        />
      )}
    </View>
  );
}

// ── Home Tab ───────────────────────────────────────────────────
function HomeTab({ onTabChange, refreshTrigger }) {
  const [postings, setPostings]       = useState([]);
  const [candidates, setCandidates]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  const load = useCallback(async () => {
    try {
      const [posts, apps] = await Promise.all([fetchPostings(), fetchApplicants()]);
      setPostings(posts);
      setCandidates(apps);
    } catch {
      setPostings([]);
      setCandidates([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);
  useEffect(() => { if (refreshTrigger > 0) load(); }, [refreshTrigger]);

  const activeCount     = postings.filter((p) => p.status === 'Active').length;
  const applicantCount  = candidates.length;
  const hiredCount      = candidates.filter((c) => c.status === 'Hired').length;

  return (
    <ScrollView showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={COLORS.gold} colors={[COLORS.gold]} />
      }>

      <View style={styles.statsRow}>
        {[
          { emoji: '📋', value: String(activeCount),    label: 'Active Posts' },
          { emoji: '👥', value: String(applicantCount), label: 'Applicants' },
          { emoji: '✅', value: String(hiredCount),     label: 'Hired' },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statEmoji}>{s.emoji}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.quickRow}>
          {[
            { emoji: '➕', label: 'Post Internship',  tab: 'post' },
            { emoji: '👥', label: 'View Candidates',  tab: 'candidates' },
            { emoji: '💬', label: 'Messages',         tab: 'chat' },
            { emoji: '🏢', label: 'Edit Profile',     tab: 'profile' },
          ].map((q) => (
            <TouchableOpacity key={q.label} style={styles.quickCard}
              onPress={() => onTabChange(q.tab)} activeOpacity={0.8}>
              <Text style={styles.quickEmoji}>{q.emoji}</Text>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My postings</Text>
          <TouchableOpacity onPress={load} activeOpacity={0.7}>
            <Text style={styles.refreshLink}>↻ Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.gold} style={{ marginVertical: 20 }} />
        ) : postings.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyBoxEmoji}>📋</Text>
            <Text style={styles.emptyBoxTitle}>No postings yet</Text>
            <Text style={styles.emptyBoxSub}>Tap "Post" to add your first internship.</Text>
          </View>
        ) : (
          postings.map((p) => (
            <View key={p.id} style={styles.postCard}>
              <View style={styles.postCardHeader}>
                <Text style={styles.postCardTitle} numberOfLines={1}>{p.title}</Text>
                <View style={[styles.statusPill, {
                  borderColor: p.status === 'Active' ? COLORS.success : COLORS.textSec
                }]}>
                  <Text style={[styles.statusPillText, {
                    color: p.status === 'Active' ? COLORS.success : COLORS.textSec
                  }]}>{p.status}</Text>
                </View>
              </View>
              <View style={styles.postCardMeta}>
                {p.duration ? <Text style={styles.metaText}>⏱ {p.duration}</Text>   : null}
                {p.stipend  ? <Text style={styles.metaText}>💰 {p.stipend}</Text>    : null}
                {p.skills   ? <Text style={styles.metaText} numberOfLines={1}>🛠 {p.skills}</Text> : null}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function BusinessDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [refreshTrigger, setRefresh] = useState(0);

  const handlePosted = () => {
    setActiveTab('home');
    setRefresh((n) => n + 1);
  };

  const renderTab = () => {
    if (activeTab === 'home')       return <HomeTab onTabChange={setActiveTab} refreshTrigger={refreshTrigger} />;
    if (activeTab === 'post')       return <PostForm onPosted={handlePosted} />;
    if (activeTab === 'candidates') return <CandidatesTab />;
    if (activeTab === 'chat')       return <BusinessChat user={user} onBack={() => setActiveTab('home')} />;
    if (activeTab === 'profile')    return <BusinessProfile user={user} onBack={() => setActiveTab('home')} />;
    return null;
  };

  const hideTopBar = activeTab === 'profile' || activeTab === 'chat';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {!hideTopBar && (
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Business Dashboard</Text>
            <Text style={styles.bizName}>{user?.name || 'Your Company'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ flex: 1, paddingHorizontal: hideTopBar ? 0 : SPACING.lg }}>
        {renderTab()}
      </View>

      <View style={styles.bottomNav}>
        {NAV_TABS.map((tab) => (
          <TouchableOpacity key={tab.key} style={styles.navTab}
            onPress={() => setActiveTab(tab.key)} activeOpacity={0.7}>
            <Text style={styles.navEmoji}>{tab.emoji}</Text>
            <Text style={[styles.navLabel, activeTab === tab.key && styles.navLabelActive]}>
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.navDot} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: COLORS.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  topBar:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, paddingTop: 30, paddingHorizontal: 20 },
  greeting:           { fontSize: 12, color: COLORS.textSec },
  bizName:            { fontSize: 18, fontWeight: '700', color: COLORS.textPri },
  logoutBtn:          { backgroundColor: COLORS.card, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 7 },
  logoutText:         { fontSize: 13, color: COLORS.error },
  statsRow:           { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md, marginTop: SPACING.sm },
  statCard:           { flex: 1, backgroundColor: COLORS.card, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center' },
  statEmoji:          { fontSize: 16, marginBottom: 4 },
  statValue:          { fontSize: 18, fontWeight: '700', color: COLORS.textPri },
  statLabel:          { fontSize: 10, color: COLORS.textSec, marginTop: 2, textAlign: 'center' },
  section:            { marginBottom: SPACING.lg },
  sectionHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle:       { fontSize: 16, fontWeight: '700', color: COLORS.textPri, marginBottom: SPACING.md },
  refreshLink:        { fontSize: 13, color: COLORS.gold },
  quickRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  quickCard:          { width: '47%', backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 0.5, borderColor: COLORS.border, alignItems: 'center', paddingVertical: SPACING.md, gap: 6 },
  quickEmoji:         { fontSize: 22 },
  quickLabel:         { fontSize: 11, color: COLORS.textSec, textAlign: 'center' },
  postCard:           { backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
  postCardHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  postCardTitle:      { fontSize: 14, fontWeight: '600', color: COLORS.textPri, flex: 1, marginRight: 8 },
  postCardMeta:       { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  metaText:           { fontSize: 12, color: COLORS.textSec },
  statusPill:         { borderWidth: 0.5, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusPillText:     { fontSize: 11, fontWeight: '600' },
  emptyBox:           { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.xl, alignItems: 'center' },
  emptyBoxEmoji:      { fontSize: 40, marginBottom: 12 },
  emptyBoxTitle:      { fontSize: 15, fontWeight: '600', color: COLORS.textPri, marginBottom: 4 },
  emptyBoxSub:        { fontSize: 13, color: COLORS.textSec, textAlign: 'center' },
  candidateCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
  candidateAvatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  candidateAvatarText:{ fontSize: 18, fontWeight: '700', color: COLORS.bg },
  candidateName:      { fontSize: 14, fontWeight: '600', color: COLORS.textPri },
  candidateRole:      { fontSize: 12, color: COLORS.textSec, marginTop: 2 },
  candidateDate:      { fontSize: 11, color: COLORS.textHint, marginTop: 2 },
  formTitle:          { fontSize: 18, fontWeight: '700', color: COLORS.textPri, marginBottom: SPACING.lg, marginTop: SPACING.sm },
  label:              { fontSize: 12, color: COLORS.textSec, marginBottom: 8, letterSpacing: 0.4 },
  input:              { backgroundColor: COLORS.bg, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 14, fontSize: 15, color: COLORS.textPri, marginBottom: SPACING.md },
  textArea:           { height: 100, paddingTop: 14 },
  postBtn:            { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: 'center' },
  postBtnText:        { color: COLORS.bg, fontSize: 15, fontWeight: '700' },
  bottomNav:          { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: COLORS.card, borderTopWidth: 0.5, borderTopColor: COLORS.border, paddingBottom: 20, paddingTop: SPACING.sm },
  navTab:             { flex: 1, alignItems: 'center', gap: 3 },
  navEmoji:           { fontSize: 20 },
  navLabel:           { fontSize: 10, color: COLORS.textSec },
  navLabelActive:     { color: COLORS.gold, fontWeight: '600' },
  navDot:             { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.gold },
  // Detail sheet
  detailOverlay:      { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  detailBg:           { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  detailSheet:        { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: '85%' },
  detailHeader:       { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg, paddingBottom: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  detailAvatar:       { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  detailAvatarText:   { fontSize: 20, fontWeight: '700', color: COLORS.bg },
  detailName:         { fontSize: 16, fontWeight: '700', color: COLORS.textPri },
  detailEmail:        { fontSize: 12, color: COLORS.textSec, marginTop: 2 },
  detailPhone:        { fontSize: 12, color: COLORS.textSec, marginTop: 2 },
  closeBtn:           { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  closeBtnText:       { fontSize: 14, color: COLORS.textSec },
  detailSection:      { marginBottom: SPACING.md, padding: SPACING.md, backgroundColor: COLORS.bg, borderRadius: RADIUS.md },
  detailSectionTitle: { fontSize: 12, color: COLORS.gold, fontWeight: '600', marginBottom: 6, letterSpacing: 0.4 },
  detailValue:        { fontSize: 14, color: COLORS.textPri, lineHeight: 20 },
  statusGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  statusBtn:          { borderWidth: 0.5, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 8 },
  statusBtnText:      { fontSize: 13, fontWeight: '600' },
});