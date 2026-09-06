import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Alert,
  ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../theme';
import { API_KEY, DB_URL } from '../config/Firebase';

const NAV_TABS = [
  { key: 'home',    label: 'Home',    emoji: '🏠' },
  { key: 'search',  label: 'Search',  emoji: '🔍' },
  { key: 'apps',    label: 'Applied', emoji: '📋' },
  { key: 'profile', label: 'Profile', emoji: '👤' },
];

// ── Fetch real internships ─────────────────────────────────────
const fetchInternships = async () => {
  try {
    const res  = await fetch(`${DB_URL}/internships?key=${API_KEY}&pageSize=10`);
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
        location: f.location?.stringValue || '',
        score:    Math.floor(Math.random() * 25) + 70,
      };
    }).filter((i) => i.title !== 'Untitled');
  } catch { return []; }
};

// ── Fetch saved student profile ────────────────────────────────
const fetchProfile = async (uid) => {
  try {
    const res  = await fetch(`${DB_URL}/students/${uid}?key=${API_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    const f    = data.fields || {};
    return {
      name:            f.name?.stringValue            || '',
      college:         f.college?.stringValue         || '',
      course:          f.course?.stringValue          || '',
      profileComplete: f.profileComplete?.integerValue || 10,
      resumeUrl:       f.resumeUrl?.stringValue       || '',
    };
  } catch { return null; }
};

// ── Fetch application count ────────────────────────────────────
const fetchAppliedCount = async (uid) => {
  try {
    const res  = await fetch(`${DB_URL}/applications?key=${API_KEY}&pageSize=100`);
    const data = await res.json();
    if (!data.documents) return 0;
    return data.documents.filter((doc) => {
      const f = doc.fields || {};
      return f.studentId?.stringValue === uid;
    }).length;
  } catch { return 0; }
};

function MatchCard({ item, onApply }) {
  return (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <View style={styles.matchIcon}><Text style={{ fontSize: 20 }}>🏢</Text></View>
        <View style={{ flex: 1, marginLeft: SPACING.sm }}>
          <Text style={styles.matchTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.matchCompany}>{item.company}</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreBadgeNum}>{item.score}%</Text>
          <Text style={styles.scoreBadgeLabel}>match</Text>
        </View>
      </View>
      <View style={styles.matchMeta}>
        {item.location ? <Text style={styles.metaText}>📍 {item.location}</Text> : null}
        {item.duration ? <Text style={styles.metaText}>⏱ {item.duration}</Text>  : null}
        {item.stipend  ? <Text style={styles.metaText}>💰 {item.stipend}</Text>   : null}
      </View>
      {item.skills ? (
        <View style={styles.skillsRow}>
          {item.skills.split(',').slice(0, 3).map((s) => s.trim()).filter(Boolean).map((s) => (
            <View key={s} style={styles.skillChip}>
              <Text style={styles.skillChipText}>{s}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.scoreBarBg}>
        <View style={[styles.scoreBarFill, { width: `${item.score}%` }]} />
      </View>
      <TouchableOpacity style={styles.applyBtn} onPress={() => onApply(item)} activeOpacity={0.85}>
        <Text style={styles.applyBtnText}>Apply Now →</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function StudentDashboard({
  user, onLogout, onGoProfile, onGoSearch, onGoApplications, onApplyInternship,
}) {
  const [internships, setInternships]     = useState([]);
  const [profile, setProfile]             = useState(null);
  const [appliedCount, setAppliedCount]   = useState(0);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);

  const loadAll = async () => {
    const uid = user?.uid;
    const [jobs, prof, count] = await Promise.all([
      fetchInternships(),
      uid ? fetchProfile(uid) : Promise.resolve(null),
      uid ? fetchAppliedCount(uid) : Promise.resolve(0),
    ]);
    setInternships(jobs);
    setProfile(prof);
    setAppliedCount(count);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadAll(); }, []);

  const onRefresh = () => { setRefreshing(true); loadAll(); };

  // Use live profile data, fall back to user prop
  const displayName    = profile?.name    || user?.name  || 'Student';
  const displayCollege = profile?.college || '';
  const completion     = profile?.profileComplete || 10;
  const hasResume      = !!profile?.resumeUrl;

  const handleNavTab = (key) => {
    if (key === 'search')  onGoSearch?.();
    if (key === 'apps')    onGoApplications?.();
    if (key === 'profile') onGoProfile?.();
  };

  const QUICK_ACTIONS = [
    { emoji: '📋', label: 'My Applications', onPress: onGoApplications },
    { emoji: '🔍', label: 'Search Jobs',     onPress: onGoSearch },
    { emoji: '👤', label: 'My Profile',      onPress: onGoProfile },
    { emoji: '🚪', label: 'Logout', onPress: () => {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: onLogout },
      ]);
    }},
  ];

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={COLORS.gold} colors={[COLORS.gold]} />
        }>

        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.studentName}>{displayName}</Text>
            {displayCollege ? <Text style={styles.studentEmail}>{displayCollege}</Text> : null}
          </View>
          <TouchableOpacity onPress={onGoProfile} activeOpacity={0.8}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Profile completion banner */}
        {completion < 100 && (
          <TouchableOpacity style={styles.profileBanner} onPress={onGoProfile} activeOpacity={0.85}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>
                {hasResume ? 'Profile almost complete!' : 'Complete your profile'}
              </Text>
              <Text style={styles.bannerSub}>
                {hasResume
                  ? 'Add more skills to get better AI matches'
                  : 'Add skills and upload resume to get better matches'}
              </Text>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${completion}%` }]} />
              </View>
              <Text style={styles.progressLabel}>{completion}% complete</Text>
            </View>
            <Text style={styles.bannerArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { emoji: '✨', value: String(internships.length), label: 'Matches' },
            { emoji: '📋', value: String(appliedCount),       label: 'Applied' },
            { emoji: '✅', value: completion >= 100 ? '✓' : `${completion}%`, label: completion >= 100 ? 'Profile' : 'Complete' },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* AI Recommendations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✨ AI Recommendations</Text>
            <TouchableOpacity onPress={onGoSearch} activeOpacity={0.7}>
              <Text style={styles.sectionLink}>See all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.gold} style={{ marginVertical: 20 }} />
          ) : internships.length === 0 ? (
            <View style={styles.emptyMatches}>
              <Text style={styles.emptyMatchesText}>No internships posted yet</Text>
              <Text style={styles.emptyMatchesSub}>Pull down to refresh</Text>
            </View>
          ) : (
            internships.slice(0, 3).map((item) => (
              <MatchCard key={item.id} item={item} onApply={onApplyInternship} />
            ))
          )}
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.quickRow}>
            {QUICK_ACTIONS.map((q) => (
              <TouchableOpacity key={q.label} style={styles.quickCard}
                onPress={q.onPress} activeOpacity={0.8}>
                <Text style={styles.quickEmoji}>{q.emoji}</Text>
                <Text style={styles.quickLabel}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        {NAV_TABS.map((tab) => (
          <TouchableOpacity key={tab.key} style={styles.navTab}
            onPress={() => handleNavTab(tab.key)} activeOpacity={0.7}>
            <Text style={styles.navEmoji}>{tab.emoji}</Text>
            <Text style={styles.navLabel}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: COLORS.bg },
  topBar:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',  paddingBottom: 16, paddingTop: 40, paddingHorizontal: 20 },
  greeting:         { fontSize: 13, color: COLORS.textSec, marginBottom: 2 },
  studentName:      { fontSize: 22, fontWeight: '700', color: COLORS.textPri },
  studentEmail:     { fontSize: 12, color: COLORS.textSec, marginTop: 2 },
  avatar:           { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText:       { fontSize: 20, fontWeight: '700', color: COLORS.bg },
  profileBanner:    { marginHorizontal: SPACING.lg, backgroundColor: '#1A1608', borderWidth: 0.5, borderColor: COLORS.goldDark, borderRadius: RADIUS.lg, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  bannerTitle:      { fontSize: 13, fontWeight: '600', color: COLORS.gold, marginBottom: 3 },
  bannerSub:        { fontSize: 11, color: COLORS.textSec, marginBottom: 8 },
  progressBg:       { height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
  progressFill:     { height: 4, backgroundColor: COLORS.gold, borderRadius: 2 },
  progressLabel:    { fontSize: 10, color: COLORS.gold, marginTop: 4 },
  bannerArrow:      { fontSize: 22, color: COLORS.gold, marginLeft: SPACING.sm },
  statsRow:         { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.md },
  statCard:         { flex: 1, backgroundColor: COLORS.card, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center' },
  statEmoji:        { fontSize: 20, marginBottom: 4 },
  statValue:        { fontSize: 22, fontWeight: '700', color: COLORS.textPri },
  statLabel:        { fontSize: 11, color: COLORS.textSec, marginTop: 2 },
  section:          { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle:     { fontSize: 16, fontWeight: '700', color: COLORS.textPri, marginBottom: SPACING.md },
  sectionLink:      { fontSize: 13, color: COLORS.gold },
  emptyMatches:     { backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.lg, alignItems: 'center' },
  emptyMatchesText: { fontSize: 14, color: COLORS.textPri, fontWeight: '600', marginBottom: 4 },
  emptyMatchesSub:  { fontSize: 12, color: COLORS.textSec },
  matchCard:        { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.md },
  matchHeader:      { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  matchIcon:        { width: 42, height: 42, backgroundColor: '#0F1E30', borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  matchTitle:       { fontSize: 14, fontWeight: '600', color: COLORS.textPri },
  matchCompany:     { fontSize: 12, color: COLORS.textSec, marginTop: 2 },
  scoreBadge:       { alignItems: 'center', backgroundColor: '#1A1608', borderWidth: 0.5, borderColor: COLORS.goldDark, borderRadius: RADIUS.md, paddingHorizontal: 8, paddingVertical: 4 },
  scoreBadgeNum:    { fontSize: 14, fontWeight: '700', color: COLORS.gold },
  scoreBadgeLabel:  { fontSize: 9, color: COLORS.textSec },
  matchMeta:        { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  metaText:         { fontSize: 11, color: COLORS.textSec },
  skillsRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.sm },
  skillChip:        { backgroundColor: '#0F1E30', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  skillChipText:    { fontSize: 11, color: '#6FB3F5', fontWeight: '500' },
  scoreBarBg:       { height: 3, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden', marginBottom: SPACING.sm },
  scoreBarFill:     { height: 3, backgroundColor: COLORS.gold, borderRadius: 2 },
  applyBtn:         { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, paddingVertical: 11, alignItems: 'center' },
  applyBtnText:     { fontSize: 14, fontWeight: '700', color: COLORS.bg },
  quickRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  quickCard:        { width: '47%', backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 0.5, borderColor: COLORS.border, alignItems: 'center', paddingVertical: SPACING.md, gap: 6 },
  quickEmoji:       { fontSize: 22 },
  quickLabel:       { fontSize: 11, color: COLORS.textSec, textAlign: 'center' },
  bottomNav:        { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: COLORS.card, borderTopWidth: 0.5, borderTopColor: COLORS.border, paddingBottom: 20, paddingTop: SPACING.sm },
  navTab:           { flex: 1, alignItems: 'center', gap: 3 },
  navEmoji:         { fontSize: 20 },
  navLabel:         { fontSize: 10, color: COLORS.textSec },
});