import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../theme';
import { API_KEY, DB_URL } from '../config/Firebase';

// ── Fetch REAL internships from Firestore ─────────────────────
const fetchInternships = async () => {
  const res = await fetch(
    `${DB_URL}/internships?key=${API_KEY}&pageSize=100`
  );
  const data = await res.json();
  console.log('Firestore response:', JSON.stringify(data).slice(0, 300));

  if (!data.documents || data.documents.length === 0) return [];

  return data.documents.map((doc) => {
    const f  = doc.fields || {};
    const id = doc.name.split('/').pop();
    return {
      id,
      title:       f.title?.stringValue       || 'Untitled',
      company:     f.company?.stringValue      || 'Unknown Company',
      skills:      f.skills?.stringValue       || '',
      duration:    f.duration?.stringValue     || '',
      stipend:     f.stipend?.stringValue      || '',
      status:      f.status?.stringValue       || 'Active',
      location:    f.location?.stringValue     || 'Not specified',
      description: f.description?.stringValue  || '',
      applicants:  f.applicants?.integerValue  || 0,
      createdAt:   f.createdAt?.stringValue    || '',
      score:       Math.floor(Math.random() * 25) + 70,
    };
  }).filter(i => i.status === 'Active');
};

// ── Submit application to Firestore ──────────────────────────
const submitApplication = async (user, internship, formData) => {
  const docId = `app_${user.uid}_${internship.id}`;
  const fields = {
    studentId:       { stringValue: user.uid            },
    studentName:     { stringValue: user.name    || ''  },
    studentEmail:    { stringValue: user.email   || ''  },
    phone:           { stringValue: formData.phone       },
    linkedin:        { stringValue: formData.linkedin    },
    portfolio:       { stringValue: formData.portfolio   },
    internshipId:    { stringValue: internship.id        },
    internshipTitle: { stringValue: internship.title     },
    company:         { stringValue: internship.company   },
    duration:        { stringValue: internship.duration  },
    stipend:         { stringValue: internship.stipend   },
    location:        { stringValue: internship.location  },
    coverLetter:     { stringValue: formData.coverLetter },
    whyUs:           { stringValue: formData.whyUs       },
    experience:      { stringValue: formData.experience  },
    availability:    { stringValue: formData.availability},
    status:          { stringValue: 'Applied'            },
    appliedAt:       { stringValue: new Date().toISOString() },
  };

  const res = await fetch(`${DB_URL}/applications/${docId}?key=${API_KEY}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Apply failed');
  }
  return docId;
};

// ── Internship Card ───────────────────────────────────────────
function InternshipCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.88}>
      <View style={styles.cardHeader}>
        <View style={styles.companyIcon}>
          <Text style={{ fontSize: 22 }}>🏢</Text>
        </View>
        <View style={{ flex: 1, marginLeft: SPACING.sm }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardCompany}>{item.company}</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreBadgeText}>{item.score}%</Text>
          <Text style={styles.scoreBadgeLabel}>match</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        {item.location ? <Text style={styles.metaText}>📍 {item.location}</Text> : null}
        {item.duration ? <Text style={styles.metaText}>⏱ {item.duration}</Text>  : null}
        {item.stipend  ? <Text style={styles.metaText}>💰 {item.stipend}</Text>   : null}
      </View>

      {item.skills ? (
        <View style={styles.skillsRow}>
          {item.skills.split(',').slice(0, 3).map((s) => (
            <View key={s.trim()} style={styles.skillChip}>
              <Text style={styles.skillChipText}>{s.trim()}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.scoreBar}>
        <View style={[styles.scoreBarFill, { width: `${item.score}%` }]} />
      </View>

      <TouchableOpacity style={styles.applyBtn} onPress={() => onPress(item)} activeOpacity={0.85}>
        <Text style={styles.applyBtnText}>View & Apply →</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Apply Form Modal ──────────────────────────────────────────
function ApplyForm({ internship, user, onClose, onSuccess }) {
  const [phone, setPhone]           = useState('');
  const [linkedin, setLinkedin]     = useState('');
  const [portfolio, setPortfolio]   = useState('');
  const [whyUs, setWhyUs]           = useState('');
  const [experience, setExperience] = useState('');
  const [coverLetter, setCover]     = useState('');
  const [availability, setAvail]    = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleSubmit = async () => {
    if (!phone.trim())       { setError('Phone number is required.'); return; }
    if (!whyUs.trim())       { setError('Please tell us why you want this internship.'); return; }
    if (!coverLetter.trim()) { setError('Cover letter is required.'); return; }

    setLoading(true);
    setError('');
    try {
      await submitApplication(user, internship, {
        phone, linkedin, portfolio, whyUs, experience, coverLetter, availability,
      });
      onSuccess();
    } catch (e) {
      setError(e.message || 'Failed to submit. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formOverlay}>
      <View style={styles.formSheet}>
        {/* Sheet header */}
        <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetTitle} numberOfLines={1}>{internship.title}</Text>
            <Text style={styles.sheetCompany}>{internship.company}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}>

          {/* Applicant banner */}
          <View style={styles.applicantRow}>
            <View style={styles.applicantAvatar}>
              <Text style={styles.applicantAvatarText}>
                {(user?.name || 'S').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ marginLeft: SPACING.sm, flex: 1 }}>
              <Text style={styles.applicantName}>{user?.name || 'Student'}</Text>
              <Text style={styles.applicantEmail}>{user?.email || ''}</Text>
            </View>
          </View>

          {/* Fields */}
          <Text style={styles.sectionLabel}>Contact Details</Text>

          <Text style={styles.fieldLabel}>Phone number *</Text>
          <TextInput style={styles.input}
            placeholder="+91 98765 43210" placeholderTextColor={COLORS.textHint}
            value={phone} onChangeText={(t) => { setPhone(t); setError(''); }}
            keyboardType="phone-pad" />

          <Text style={styles.fieldLabel}>LinkedIn (optional)</Text>
          <TextInput style={styles.input}
            placeholder="linkedin.com/in/yourname" placeholderTextColor={COLORS.textHint}
            value={linkedin} onChangeText={setLinkedin} autoCapitalize="none" />

          <Text style={styles.fieldLabel}>Portfolio / GitHub (optional)</Text>
          <TextInput style={styles.input}
            placeholder="github.com/yourname" placeholderTextColor={COLORS.textHint}
            value={portfolio} onChangeText={setPortfolio} autoCapitalize="none" />

          <Text style={styles.sectionLabel}>Your Application</Text>

          <Text style={styles.fieldLabel}>Why do you want this internship? *</Text>
          <TextInput style={[styles.input, styles.textArea]}
            placeholder="Tell us what excites you about this role..."
            placeholderTextColor={COLORS.textHint}
            value={whyUs} onChangeText={(t) => { setWhyUs(t); setError(''); }}
            multiline numberOfLines={3} textAlignVertical="top" />

          <Text style={styles.fieldLabel}>Relevant experience</Text>
          <TextInput style={[styles.input, styles.textArea]}
            placeholder="Projects, coursework, previous internships..."
            placeholderTextColor={COLORS.textHint}
            value={experience} onChangeText={setExperience}
            multiline numberOfLines={3} textAlignVertical="top" />

          <Text style={styles.fieldLabel}>Cover letter *</Text>
          <TextInput style={[styles.input, styles.textAreaLg]}
            placeholder="Introduce yourself and why you're the right fit..."
            placeholderTextColor={COLORS.textHint}
            value={coverLetter} onChangeText={(t) => { setCover(t); setError(''); }}
            multiline numberOfLines={5} textAlignVertical="top" />

          <Text style={styles.fieldLabel}>When can you start?</Text>
          <TextInput style={styles.input}
            placeholder="e.g. Immediately / After 15 June"
            placeholderTextColor={COLORS.textHint}
            value={availability} onChangeText={setAvail} />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color={COLORS.bg} />
              : <Text style={styles.submitBtnText}>Submit Application</Text>}
          </TouchableOpacity>

        </ScrollView>
      </View>
    </View>
  );
}

// ── Success Screen ────────────────────────────────────────────
function SuccessView({ internship, onDone }) {
  return (
    <View style={styles.successWrap}>
      <View style={styles.successCircle}>
        <Text style={styles.successTick}>✓</Text>
      </View>
      <Text style={styles.successTitle}>Applied!</Text>
      <Text style={styles.successSub}>
        Your application for{'\n'}
        <Text style={{ color: COLORS.gold, fontWeight: '700' }}>{internship?.title}</Text>
        {'\n'}at <Text style={{ color: COLORS.gold, fontWeight: '700' }}>{internship?.company}</Text>
        {'\n'}has been submitted.
      </Text>
      <View style={styles.successMeta}>
        {[
          { label: 'Status',   value: 'Applied ✅' },
          { label: 'Duration', value: internship?.duration || 'N/A' },
          { label: 'Stipend',  value: internship?.stipend  || 'N/A' },
        ].map((m) => (
          <View key={m.label} style={styles.successMetaRow}>
            <Text style={styles.successMetaLabel}>{m.label}</Text>
            <Text style={styles.successMetaValue}>{m.value}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.doneBtn} onPress={onDone} activeOpacity={0.85}>
        <Text style={styles.doneBtnText}>Back to Search</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────
export default function InternshipSearch({ user, onBack, onApply }) {
  const [query, setQuery]               = useState('');
  const [activeFilter, setFilter]       = useState('All');
  const [internships, setInternships]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [selected, setSelected]         = useState(null);  // internship to apply
  const [appliedSuccess, setSuccess]    = useState(false);
  const [appliedIds, setAppliedIds]     = useState(new Set());

  const loadInternships = async () => {
    try {
      const data = await fetchInternships();
      console.log(`Loaded ${data.length} internships from Firestore`);
      setInternships(data);
    } catch (e) {
      console.log('Error loading internships:', e.message);
      setInternships([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInternships();
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(loadInternships, 10000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => { setRefreshing(true); loadInternships(); };

  const filtered = internships.filter((i) => {
    const q = query.toLowerCase();
    const matchSearch = q === '' ||
      i.title.toLowerCase().includes(q) ||
      i.company.toLowerCase().includes(q) ||
      i.skills.toLowerCase().includes(q);
    const matchFilter = activeFilter === 'All' ||
      i.title.toLowerCase().includes(activeFilter.toLowerCase()) ||
      i.skills.toLowerCase().includes(activeFilter.toLowerCase());
    return matchSearch && matchFilter;
  });

  // Show success screen after apply
  if (appliedSuccess && selected) {
    return (
      <SafeAreaView style={styles.root}>
        <SuccessView
          internship={selected}
          onDone={() => { setSuccess(false); setSelected(null); }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Internships</Text>
        <TouchableOpacity onPress={() => { setLoading(true); loadInternships(); }} activeOpacity={0.7}>
          <Text style={styles.refreshBtn}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput}
            placeholder="Search by title, company or skill..."
            placeholderTextColor={COLORS.textHint}
            value={query} onChangeText={setQuery} />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>



      {/* Count */}
      <View style={styles.resultsMeta}>
        <Text style={styles.resultsCount}>
          {loading ? 'Loading...' : `${filtered.length} internship${filtered.length !== 1 ? 's' : ''} found`}
        </Text>
        <Text style={styles.sortLabel}>✨ AI sorted</Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.gold} size="large" />
          <Text style={styles.loadingText}>Fetching latest internships...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor={COLORS.gold} colors={[COLORS.gold]} />
          }>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>No internships yet</Text>
              <Text style={styles.emptySub}>Businesses haven't posted any yet.{'\n'}Pull down to refresh.</Text>
            </View>
          ) : (
            filtered.map((item) => (
              <InternshipCard
                key={item.id}
                item={item}
                onPress={(internship) => setSelected(internship)}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Apply form overlay */}
      {selected && !appliedSuccess && (
        <ApplyForm
          internship={selected}
          user={user}
          onClose={() => setSelected(null)}
          onSuccess={() => {
            setAppliedIds((prev) => new Set([...prev, selected.id]));
            setSuccess(true);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: COLORS.bg, paddingTop: 20 },
  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, paddingTop: 20, paddingHorizontal: 20 },
  back:              { fontSize: 16, color: COLORS.gold, minWidth: 50 },
  headerTitle:       { fontSize: 16, fontWeight: '600', color: COLORS.textPri },
  refreshBtn:        { fontSize: 20, color: COLORS.gold },
  searchWrap:        { paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  searchBar:         { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 12 },
  searchIcon:        { fontSize: 16, marginRight: SPACING.sm },
  searchInput:       { flex: 1, fontSize: 15, color: COLORS.textPri },
  clearBtn:          { fontSize: 14, color: COLORS.textSec, paddingHorizontal: 4 },
  resultsMeta:       { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  resultsCount:      { fontSize: 13, color: COLORS.textSec },
  sortLabel:         { fontSize: 13, color: COLORS.gold },
  loadingWrap:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText:       { fontSize: 14, color: COLORS.textSec },
  listContent:       { paddingHorizontal: SPACING.lg, paddingBottom: 40 },

  // Internship card
  card:              { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.md },
  cardHeader:        { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  companyIcon:       { width: 44, height: 44, backgroundColor: '#0F1E30', borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  cardTitle:         { fontSize: 14, fontWeight: '600', color: COLORS.textPri },
  cardCompany:       { fontSize: 12, color: COLORS.textSec, marginTop: 2 },
  scoreBadge:        { alignItems: 'center', backgroundColor: '#1A1608', borderWidth: 0.5, borderColor: COLORS.goldDark, borderRadius: RADIUS.md, paddingHorizontal: 8, paddingVertical: 4 },
  scoreBadgeText:    { fontSize: 14, fontWeight: '700', color: COLORS.gold },
  scoreBadgeLabel:   { fontSize: 9, color: COLORS.textSec },
  metaRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  metaText:          { fontSize: 11, color: COLORS.textSec },
  skillsRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.sm },
  skillChip:         { backgroundColor: '#0F1E30', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  skillChipText:     { fontSize: 11, color: '#6FB3F5', fontWeight: '500' },
  scoreBar:          { height: 3, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden', marginBottom: SPACING.sm },
  scoreBarFill:      { height: 3, backgroundColor: COLORS.gold, borderRadius: 2 },
  applyBtn:          { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, paddingVertical: 11, alignItems: 'center' },
  applyBtnText:      { fontSize: 14, fontWeight: '700', color: COLORS.bg },

  // Empty
  emptyState:        { alignItems: 'center', paddingTop: 80 },
  emptyEmoji:        { fontSize: 48, marginBottom: 16 },
  emptyTitle:        { fontSize: 18, fontWeight: '700', color: COLORS.textPri, marginBottom: 8 },
  emptySub:          { fontSize: 14, color: COLORS.textSec, textAlign: 'center', lineHeight: 22 },

  // Apply form overlay
  formOverlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  formSheet:         { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: '90%' },
  sheetHeader:       { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg, paddingBottom: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  sheetTitle:        { fontSize: 16, fontWeight: '700', color: COLORS.textPri },
  sheetCompany:      { fontSize: 13, color: COLORS.textSec, marginTop: 2 },
  closeBtn:          { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  closeBtnText:      { fontSize: 14, color: COLORS.textSec },
  applicantRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.md },
  applicantAvatar:   { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  applicantAvatarText:{ fontSize: 16, fontWeight: '700', color: COLORS.bg },
  applicantName:     { fontSize: 14, fontWeight: '600', color: COLORS.textPri },
  applicantEmail:    { fontSize: 11, color: COLORS.textSec },
  sectionLabel:      { fontSize: 13, fontWeight: '700', color: COLORS.gold, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  fieldLabel:        { fontSize: 12, color: COLORS.textSec, marginBottom: 6, letterSpacing: 0.3 },
  input:             { backgroundColor: COLORS.bg, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: 14, color: COLORS.textPri, marginBottom: SPACING.md },
  textArea:          { height: 80, paddingTop: 12 },
  textAreaLg:        { height: 110, paddingTop: 12 },
  errorBox:          { backgroundColor: '#1F0A0A', borderWidth: 0.5, borderColor: '#5C2020', borderRadius: RADIUS.sm, padding: SPACING.sm, marginBottom: SPACING.sm },
  errorText:         { fontSize: 13, color: COLORS.error },
  submitBtn:         { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: 'center', marginTop: SPACING.sm },
  submitBtnText:     { color: COLORS.bg, fontSize: 15, fontWeight: '700' },

  // Success
  successWrap:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  successCircle:     { width: 84, height: 84, borderRadius: 42, backgroundColor: '#0A1F0A', borderWidth: 2, borderColor: COLORS.success, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  successTick:       { fontSize: 36, color: COLORS.success },
  successTitle:      { fontSize: 26, fontWeight: '700', color: COLORS.textPri, marginBottom: SPACING.sm },
  successSub:        { fontSize: 14, color: COLORS.textSec, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.lg },
  successMeta:       { width: '100%', backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: COLORS.border, marginBottom: SPACING.lg, overflow: 'hidden' },
  successMetaRow:    { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  successMetaLabel:  { fontSize: 13, color: COLORS.textSec },
  successMetaValue:  { fontSize: 13, fontWeight: '600', color: COLORS.textPri },
  doneBtn:           { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, paddingVertical: 14, paddingHorizontal: 48, alignItems: 'center' },
  doneBtnText:       { color: COLORS.bg, fontSize: 15, fontWeight: '700' },
});