import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../theme';
import { API_KEY, DB_URL } from '../config/Firebase';

const STATUS_META = {
  'Applied':     { color: COLORS.textSec,  bg: '#1A1A2E', label: 'Applied' },
  'Under Review':{ color: COLORS.warning,  bg: '#1F1700', label: 'Under Review' },
  'Shortlisted': { color: COLORS.success,  bg: '#0A1F0A', label: 'Shortlisted' },
  'Rejected':    { color: COLORS.error,    bg: '#1F0A0A', label: 'Rejected' },
  'Hired':       { color: COLORS.gold,     bg: '#1A1608', label: 'Hired 🎉' },
};

// ── Fetch applications for this student ───────────────────────
const fetchApplications = async (uid) => {
  const res = await fetch(`${DB_URL}/applications?key=${API_KEY}&pageSize=100`);
  if (!res.ok) throw new Error('Failed to fetch');
  const data = await res.json();
  if (!data.documents) return [];

  return data.documents
    .map((doc) => {
      const f  = doc.fields || {};
      const id = doc.name.split('/').pop();
      return {
        id,
        studentId:      f.studentId?.stringValue      || '',
        studentName:    f.studentName?.stringValue     || '',
        internshipId:   f.internshipId?.stringValue    || '',
        internshipTitle:f.internshipTitle?.stringValue || 'Untitled',
        company:        f.company?.stringValue         || 'Unknown Company',
        status:         f.status?.stringValue          || 'Applied',
        appliedAt:      f.appliedAt?.stringValue       || '',
        location:       f.location?.stringValue        || '',
        duration:       f.duration?.stringValue        || '',
        stipend:        f.stipend?.stringValue         || '',
      };
    })
    .filter((a) => a.studentId === uid); // only this student's applications
};

// ── Fetch all internships for browsing ────────────────────────
const fetchInternships = async () => {
  const res = await fetch(`${DB_URL}/internships?key=${API_KEY}&pageSize=100`);
  if (!res.ok) throw new Error('Failed to fetch internships');
  const data = await res.json();
  if (!data.documents) return [];

  return data.documents.map((doc) => {
    const f  = doc.fields || {};
    const id = doc.name.split('/').pop();
    return {
      id,
      title:    f.title?.stringValue    || 'Untitled',
      company:  f.company?.stringValue  || 'Unknown',
      skills:   f.skills?.stringValue   || '',
      duration: f.duration?.stringValue || '',
      stipend:  f.stipend?.stringValue  || '',
      status:   f.status?.stringValue   || 'Active',
      location: f.location?.stringValue || 'Not specified',
    };
  });
};

// ── Apply to internship ───────────────────────────────────────
const applyToInternship = async (user, internship) => {
  const docId = `app_${user.uid}_${internship.id}`;
  const fields = {
    studentId:      { stringValue: user.uid       || '' },
    studentName:    { stringValue: user.name      || '' },
    internshipId:   { stringValue: internship.id  || '' },
    internshipTitle:{ stringValue: internship.title },
    company:        { stringValue: internship.company },
    duration:       { stringValue: internship.duration },
    stipend:        { stringValue: internship.stipend },
    location:       { stringValue: internship.location },
    status:         { stringValue: 'Applied' },
    appliedAt:      { stringValue: new Date().toISOString() },
  };
  const res = await fetch(`${DB_URL}/applications/${docId}?key=${API_KEY}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error('Apply failed');
  return docId;
};

// ── Format date ───────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
};

// ── Application Card ──────────────────────────────────────────
function ApplicationCard({ item, onWithdraw }) {
  const meta = STATUS_META[item.status] || STATUS_META['Applied'];
  return (
    <View style={styles.appCard}>
      <View style={styles.appCardHeader}>
        <View style={styles.companyIcon}>
          <Text style={{ fontSize: 20 }}>🏢</Text>
        </View>
        <View style={{ flex: 1, marginLeft: SPACING.sm }}>
          <Text style={styles.appTitle} numberOfLines={1}>{item.internshipTitle}</Text>
          <Text style={styles.appCompany}>{item.company}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: meta.bg, borderColor: meta.color }]}>
          <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>

      <View style={styles.appMeta}>
        {item.duration ? <Text style={styles.metaText}>⏱ {item.duration}</Text> : null}
        {item.stipend  ? <Text style={styles.metaText}>💰 {item.stipend}</Text>  : null}
        {item.location ? <Text style={styles.metaText}>📍 {item.location}</Text> : null}
      </View>

      {item.appliedAt ? (
        <Text style={styles.appliedDate}>Applied on {formatDate(item.appliedAt)}</Text>
      ) : null}

      {/* Status timeline */}
      <View style={styles.timeline}>
        {['Applied', 'Under Review', 'Shortlisted', 'Hired'].map((s, i) => {
          const steps = ['Applied', 'Under Review', 'Shortlisted', 'Hired'];
          const current = steps.indexOf(item.status);
          const isDone  = i <= current;
          const isLast  = i === steps.length - 1;
          return (
            <View key={s} style={styles.timelineStep}>
              <View style={[styles.timelineDot, isDone && styles.timelineDotDone]} />
              {!isLast && <View style={[styles.timelineLine, isDone && i < current && styles.timelineLineDone]} />}
              <Text style={[styles.timelineLabel, isDone && styles.timelineLabelDone]} numberOfLines={1}>
                {s}
              </Text>
            </View>
          );
        })}
      </View>

      {item.status === 'Applied' && (
        <TouchableOpacity style={styles.withdrawBtn} onPress={() => onWithdraw(item)} activeOpacity={0.8}>
          <Text style={styles.withdrawText}>Withdraw</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Browse Internship Card ────────────────────────────────────
function BrowseCard({ item, onApply, applied }) {
  return (
    <View style={styles.browseCard}>
      <View style={styles.appCardHeader}>
        <View style={styles.companyIcon}>
          <Text style={{ fontSize: 20 }}>🏢</Text>
        </View>
        <View style={{ flex: 1, marginLeft: SPACING.sm }}>
          <Text style={styles.appTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.appCompany}>{item.company}</Text>
        </View>
        <View style={[styles.statusBadge, {
          backgroundColor: item.status === 'Active' ? '#0A1F0A' : '#1A1A2E',
          borderColor: item.status === 'Active' ? COLORS.success : COLORS.textSec,
        }]}>
          <Text style={[styles.statusText, {
            color: item.status === 'Active' ? COLORS.success : COLORS.textSec,
          }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.appMeta}>
        {item.duration ? <Text style={styles.metaText}>⏱ {item.duration}</Text> : null}
        {item.stipend  ? <Text style={styles.metaText}>💰 {item.stipend}</Text>  : null}
        {item.location ? <Text style={styles.metaText}>📍 {item.location}</Text> : null}
      </View>

      {item.skills ? (
        <View style={styles.skillsRow}>
          {item.skills.split(',').slice(0, 4).map((s) => (
            <View key={s.trim()} style={styles.skillChip}>
              <Text style={styles.skillChipText}>{s.trim()}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.applyBtn, applied && styles.applyBtnDone]}
        onPress={() => !applied && onApply(item)}
        activeOpacity={applied ? 1 : 0.85}
      >
        <Text style={[styles.applyBtnText, applied && { color: COLORS.success }]}>
          {applied ? '✅ Applied' : 'Apply Now'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────
export default function StudentApplications({ user, onBack }) {
  const [tab, setTab]               = useState('My Applications');
  const [applications, setApps]     = useState([]);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applying, setApplying]     = useState(null);

  const appliedIds = new Set(applications.map((a) => a.internshipId));

  const loadData = useCallback(async () => {
    try {
      const [apps, jobs] = await Promise.all([
        fetchApplications(user?.uid || ''),
        fetchInternships(),
      ]);
      setApps(apps);
      setInternships(jobs);
    } catch (e) {
      console.log('Load error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleApply = (internship) => {
    Alert.alert(
      'Apply for this internship?',
      `${internship.title} at ${internship.company}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply Now',
          onPress: async () => {
            setApplying(internship.id);
            try {
              await applyToInternship(user, internship);
              await loadData(); // refresh both lists
              Alert.alert('Applied!', `You applied to ${internship.title}. Good luck! 🎉`);
            } catch (e) {
              Alert.alert('Error', 'Failed to apply. Try again.');
            } finally {
              setApplying(null);
            }
          },
        },
      ]
    );
  };

  const handleWithdraw = (app) => {
    Alert.alert(
      'Withdraw application?',
      `Remove your application for ${app.internshipTitle}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(
                `${DB_URL}/applications/app_${user?.uid}_${app.internshipId}?key=${API_KEY}`,
                { method: 'DELETE' }
              );
              await loadData();
              Alert.alert('Withdrawn', 'Your application has been removed.');
            } catch (e) {
              Alert.alert('Error', 'Failed to withdraw.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Internships</Text>
        <TouchableOpacity onPress={loadData} activeOpacity={0.7}>
          <Text style={styles.refreshLink}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Main tabs */}
      <View style={styles.mainTabRow}>
        {['My Applications', 'Browse'].map((t) => (
          <TouchableOpacity key={t} style={[styles.mainTab, tab === t && styles.mainTabActive]}
            onPress={() => setTab(t)} activeOpacity={0.8}>
            <Text style={[styles.mainTabText, tab === t && styles.mainTabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} size="large" style={{ marginTop: 60 }} />
      ) : tab === 'My Applications' ? (
        <>
          {/* Stats bar */}
          <View style={styles.statsRow}>
            {[
              { label: 'Total',       value: applications.length },
              { label: 'Shortlisted', value: applications.filter(a => a.status === 'Shortlisted').length },
              { label: 'Hired',       value: applications.filter(a => a.status === 'Hired').length },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
                tintColor={COLORS.gold} colors={[COLORS.gold]} />
            }
          >
            {applications.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyTitle}>No applications yet</Text>
                <Text style={styles.emptySub}>Browse internships and apply!</Text>
                <TouchableOpacity style={styles.browseBtn} onPress={() => setTab('Browse')} activeOpacity={0.8}>
                  <Text style={styles.browseBtnText}>Browse Internships</Text>
                </TouchableOpacity>
              </View>
            ) : (
              applications.map((item) => (
                <ApplicationCard key={item.id} item={item} onWithdraw={handleWithdraw} />
              ))
            )}
          </ScrollView>
        </>
      ) : (
        /* Browse tab */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor={COLORS.gold} colors={[COLORS.gold]} />
          }
        >
          {internships.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>No internships posted yet</Text>
              <Text style={styles.emptySub}>Check back soon!</Text>
            </View>
          ) : (
            internships.map((item) => (
              <View key={item.id} style={{ position: 'relative' }}>
                <BrowseCard
                  item={item}
                  onApply={handleApply}
                  applied={appliedIds.has(item.id)}
                />
                {applying === item.id && (
                  <View style={styles.overlay}>
                    <ActivityIndicator color={COLORS.gold} />
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: COLORS.bg },
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, paddingTop: 40, paddingHorizontal: 20 },
  back:               { fontSize: 16, color: COLORS.gold, minWidth: 40 },
  headerTitle:        { fontSize: 16, fontWeight: '600', color: COLORS.textPri },
  refreshLink:        { fontSize: 20, color: COLORS.gold, minWidth: 40, textAlign: 'right' },
  mainTabRow:         { flexDirection: 'row', marginHorizontal: SPACING.lg, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 4, marginBottom: SPACING.md, borderWidth: 0.5, borderColor: COLORS.border },
  mainTab:            { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: RADIUS.md },
  mainTabActive:      { backgroundColor: COLORS.gold },
  mainTabText:        { fontSize: 14, fontWeight: '500', color: COLORS.textSec },
  mainTabTextActive:  { color: COLORS.bg, fontWeight: '700' },
  statsRow:           { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.md },
  statCard:           { flex: 1, backgroundColor: COLORS.card, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center' },
  statValue:          { fontSize: 20, fontWeight: '700', color: COLORS.textPri },
  statLabel:          { fontSize: 11, color: COLORS.textSec, marginTop: 2 },
  listContent:        { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
  appCard:            { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.md },
  browseCard:         { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.md },
  appCardHeader:      { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  companyIcon:        { width: 42, height: 42, backgroundColor: '#0F1E30', borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  appTitle:           { fontSize: 14, fontWeight: '600', color: COLORS.textPri },
  appCompany:         { fontSize: 12, color: COLORS.textSec, marginTop: 2 },
  statusBadge:        { borderWidth: 0.5, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 4 },
  statusText:         { fontSize: 11, fontWeight: '600' },
  appMeta:            { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  metaText:           { fontSize: 12, color: COLORS.textSec },
  appliedDate:        { fontSize: 11, color: COLORS.textHint, marginBottom: SPACING.sm },
  skillsRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.sm },
  skillChip:          { backgroundColor: '#0F1E30', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  skillChipText:      { fontSize: 11, color: '#6FB3F5', fontWeight: '500' },
  timeline:           { flexDirection: 'row', alignItems: 'flex-start', marginTop: SPACING.sm, marginBottom: SPACING.sm },
  timelineStep:       { flex: 1, alignItems: 'center' },
  timelineDot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.border, marginBottom: 4 },
  timelineDotDone:    { backgroundColor: COLORS.gold },
  timelineLine:       { position: 'absolute', top: 4, left: '50%', right: '-50%', height: 2, backgroundColor: COLORS.border },
  timelineLineDone:   { backgroundColor: COLORS.gold },
  timelineLabel:      { fontSize: 9, color: COLORS.textSec, textAlign: 'center' },
  timelineLabelDone:  { color: COLORS.gold },
  withdrawBtn:        { alignSelf: 'flex-end', borderWidth: 0.5, borderColor: COLORS.errorBorder, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 6, marginTop: 4 },
  withdrawText:       { fontSize: 12, color: COLORS.error },
  applyBtn:           { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center', marginTop: SPACING.sm },
  applyBtnDone:       { backgroundColor: '#0A1F0A', borderWidth: 0.5, borderColor: COLORS.success },
  applyBtnText:       { color: COLORS.bg, fontSize: 14, fontWeight: '700' },
  overlay:            { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,20,0.7)', borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center' },
  emptyState:         { alignItems: 'center', paddingTop: 60 },
  emptyEmoji:         { fontSize: 48, marginBottom: 16 },
  emptyTitle:         { fontSize: 18, fontWeight: '700', color: COLORS.textPri, marginBottom: 8 },
  emptySub:           { fontSize: 14, color: COLORS.textSec, marginBottom: 20 },
  browseBtn:          { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, paddingHorizontal: 24, paddingVertical: 12 },
  browseBtnText:      { color: COLORS.bg, fontSize: 14, fontWeight: '700' },
});