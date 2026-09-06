import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert, TextInput,
  StatusBar, Platform,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../theme';
import { API_KEY, DB_URL } from '../config/Firebase';

const NAV_TABS = [
  { key: 'dashboard',  label: 'Dashboard',  emoji: '📊' },
  { key: 'students',   label: 'Students',   emoji: '🎓' },
  { key: 'businesses', label: 'Business',   emoji: '🏢' },
  { key: 'internships',label: 'Posts',      emoji: '📋' },
  { key: 'reports',    label: 'Reports',    emoji: '🚨' },
];

// ── API helpers ───────────────────────────────────────────────
const fetchCollection = async (collection) => {
  const res  = await fetch(`${DB_URL}/${collection}?key=${API_KEY}&pageSize=100`);
  const data = await res.json();
  if (!data.documents) return [];
  return data.documents.map((doc) => {
    const f  = doc.fields || {};
    const id = doc.name.split('/').pop();
    const obj = { id };
    Object.entries(f).forEach(([k, v]) => {
      obj[k] = v.stringValue ?? v.integerValue ?? v.booleanValue ?? '';
    });
    return obj;
  });
};

const deleteDocument = async (collection, id) => {
  await fetch(`${DB_URL}/${collection}/${id}?key=${API_KEY}`, { method: 'DELETE' });
};

const updateField = async (collection, id, fieldName, value) => {
  const isString  = typeof value === 'string';
  const isBoolean = typeof value === 'boolean';
  const fieldValue = isBoolean
    ? { booleanValue: value }
    : { stringValue: value };
  const fields = { [fieldName]: fieldValue };
  await fetch(`${DB_URL}/${collection}/${id}?key=${API_KEY}&updateMask.fieldPaths=${fieldName}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fields }),
  });
};

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ emoji, value, label, color }) {
  return (
    <View style={[styles.statCard, color && { borderColor: color + '44' }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, color && { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Dashboard Tab ─────────────────────────────────────────────
function DashboardTab({ stats, loading, onRefresh, refreshing }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
          tintColor={COLORS.gold} colors={[COLORS.gold]} />
      }>

      <Text style={styles.tabTitle}>Platform Overview</Text>

      {loading ? <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} /> : (
        <>
          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <StatCard emoji="🎓" value={stats.students}    label="Students"    color={COLORS.gold} />
            <StatCard emoji="🏢" value={stats.businesses}  label="Businesses"  color="#378ADD" />
            <StatCard emoji="📋" value={stats.internships} label="Internships" color={COLORS.success} />
            <StatCard emoji="📄" value={stats.applications}label="Applications" color="#D4537E" />
          </View>

          {/* Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Platform activity</Text>
            {[
              { label: 'Verified businesses',   value: stats.verified,   emoji: '✅' },
              { label: 'Pending verification',  value: stats.unverified, emoji: '⏳' },
              { label: 'Active internships',    value: stats.active,     emoji: '🟢' },
              { label: 'Total applications',    value: stats.applications, emoji: '📨' },
            ].map((r) => (
              <View key={r.label} style={styles.activityRow}>
                <Text style={styles.activityEmoji}>{r.emoji}</Text>
                <Text style={styles.activityLabel}>{r.label}</Text>
                <Text style={styles.activityValue}>{r.value}</Text>
              </View>
            ))}
          </View>

          {/* AI Monitor */}
          <View style={styles.aiCard}>
            <Text style={styles.aiTitle}>🤖 AI Recommendation System</Text>
            <Text style={styles.aiSub}>Status: Active</Text>
            <View style={styles.aiRow}>
              <View style={styles.aiStat}>
                <Text style={styles.aiStatVal}>{stats.students}</Text>
                <Text style={styles.aiStatLabel}>Profiles indexed</Text>
              </View>
              <View style={styles.aiStat}>
                <Text style={styles.aiStatVal}>{stats.internships}</Text>
                <Text style={styles.aiStatLabel}>Jobs matched</Text>
              </View>
              <View style={styles.aiStat}>
                <Text style={styles.aiStatVal}>85%</Text>
                <Text style={styles.aiStatLabel}>Avg match score</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ── Students Tab ──────────────────────────────────────────────
function StudentsTab() {
  const [students, setStudents]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);

  const load = async () => {
    try { setStudents(await fetchCollection('students')); }
    catch { setStudents([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = (student) => {
    Alert.alert(
      'Remove student',
      `Remove ${student.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: async () => {
          await deleteDocument('students', student.id);
          await deleteDocument('users', student.id);
          setStudents((p) => p.filter((s) => s.id !== student.id));
          setSelected(null);
          Alert.alert('Removed', `${student.name} has been removed.`);
        }},
      ]
    );
  };

  const filtered = students.filter((s) =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Search students..."
          placeholderTextColor={COLORS.textHint} value={search} onChangeText={setSearch} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={COLORS.gold} colors={[COLORS.gold]} />
        }>
        {loading ? (
          <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🎓</Text>
            <Text style={styles.emptyTitle}>{search ? 'No results' : 'No students yet'}</Text>
          </View>
        ) : (
          filtered.map((s) => (
            <TouchableOpacity key={s.id} style={styles.listCard}
              onPress={() => setSelected(s)} activeOpacity={0.85}>
              <View style={styles.listAvatar}>
                <Text style={styles.listAvatarText}>{(s.name || 'S').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={styles.listName}>{s.name || 'Unknown'}</Text>
                <Text style={styles.listSub}>{s.email || ''}</Text>
                {s.college ? <Text style={styles.listMeta}>{s.college}</Text> : null}
              </View>
              <View style={styles.completionBadge}>
                <Text style={styles.completionText}>{s.profileComplete || 10}%</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Student detail sheet */}
      {selected && (
        <View style={styles.detailOverlay}>
          <TouchableOpacity style={styles.detailBg} onPress={() => setSelected(null)} activeOpacity={1} />
          <View style={styles.detailSheet}>
            <View style={styles.detailHeader}>
              <View style={styles.detailAvatar}>
                <Text style={styles.detailAvatarText}>{(selected.name || 'S').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={styles.detailName}>{selected.name}</Text>
                <Text style={styles.detailEmail}>{selected.email}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View>
              {[
                { label: 'College',  value: selected.college  || '—' },
                { label: 'Course',   value: selected.course   || '—' },
                { label: 'Skills',   value: selected.skills   || '—' },
                { label: 'Resume',   value: selected.resumeUrl ? '✅ Uploaded' : '❌ Not uploaded' },
                { label: 'Profile',  value: `${selected.profileComplete || 10}% complete` },
              ].map((r) => (
                <View key={r.label} style={styles.detailRow}>
                  <Text style={styles.detailRowLabel}>{r.label}</Text>
                  <Text style={styles.detailRowValue}>{r.value}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(selected)}>
              <Text style={styles.deleteBtnText}>🗑 Remove Student</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Businesses Tab ────────────────────────────────────────────
function BusinessesTab() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(null);

  const load = async () => {
    try { setBusinesses(await fetchCollection('businesses')); }
    catch { setBusinesses([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const handleVerify = async (biz, verified) => {
    try {
      await updateField('businesses', biz.id, 'verified', verified);
      setBusinesses((p) => p.map((b) => b.id === biz.id ? { ...b, verified } : b));
      setSelected((p) => p ? { ...p, verified } : p);
      Alert.alert(verified ? '✅ Verified' : '❌ Unverified', `${biz.businessName || biz.name} has been ${verified ? 'verified' : 'unverified'}.`);
    } catch {
      Alert.alert('Error', 'Failed to update verification.');
    }
  };

  const handleDelete = (biz) => {
    Alert.alert('Remove business', `Remove ${biz.businessName || biz.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: async () => {
          await deleteDocument('businesses', biz.id);
          await deleteDocument('users', biz.id);
          setBusinesses((p) => p.filter((b) => b.id !== biz.id));
          setSelected(null);
        }},
      ]
    );
  };

  const filtered = businesses.filter((b) =>
    !search ||
    (b.businessName || b.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Search businesses..."
          placeholderTextColor={COLORS.textHint} value={search} onChangeText={setSearch} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={COLORS.gold} colors={[COLORS.gold]} />
        }>
        {loading ? (
          <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🏢</Text>
            <Text style={styles.emptyTitle}>{search ? 'No results' : 'No businesses yet'}</Text>
          </View>
        ) : (
          filtered.map((b) => (
            <TouchableOpacity key={b.id} style={styles.listCard}
              onPress={() => setSelected(b)} activeOpacity={0.85}>
              <View style={[styles.listAvatar, { backgroundColor: '#0F1E30' }]}>
                <Text style={{ fontSize: 20 }}>🏢</Text>
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={styles.listName}>{b.businessName || b.name || 'Unknown'}</Text>
                <Text style={styles.listSub}>{b.email || ''}</Text>
                {b.industry ? <Text style={styles.listMeta}>{b.industry}</Text> : null}
              </View>
              <View style={[styles.verifyBadge,
                { backgroundColor: b.verified ? '#0A1F0A' : '#1F1700',
                  borderColor: b.verified ? COLORS.success : COLORS.warning }]}>
                <Text style={{ fontSize: 12, color: b.verified ? COLORS.success : COLORS.warning, fontWeight: '600' }}>
                  {b.verified ? '✅ Verified' : '⏳ Pending'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {selected && (
        <View style={styles.detailOverlay}>
          <TouchableOpacity style={styles.detailBg} onPress={() => setSelected(null)} activeOpacity={1} />
          <View style={styles.detailSheet}>
            <View style={styles.detailHeader}>
              <View style={[styles.detailAvatar, { backgroundColor: '#0F1E30' }]}>
                <Text style={{ fontSize: 24 }}>🏢</Text>
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={styles.detailName}>{selected.businessName || selected.name}</Text>
                <Text style={styles.detailEmail}>{selected.email}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View>
              {[
                { label: 'Industry',  value: selected.industry  || '—' },
                { label: 'Location',  value: selected.location  || '—' },
                { label: 'Website',   value: selected.website   || '—' },
                { label: 'Phone',     value: selected.phone     || '—' },
                { label: 'Status',    value: selected.verified ? '✅ Verified' : '⏳ Pending verification' },
              ].map((r) => (
                <View key={r.label} style={styles.detailRow}>
                  <Text style={styles.detailRowLabel}>{r.label}</Text>
                  <Text style={styles.detailRowValue}>{r.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: selected.verified ? COLORS.warning : COLORS.success }]}
                onPress={() => handleVerify(selected, !selected.verified)} activeOpacity={0.8}>
                <Text style={[styles.actionBtnText, { color: selected.verified ? COLORS.warning : COLORS.success }]}>
                  {selected.verified ? '❌ Unverify' : '✅ Verify'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.error }]}
                onPress={() => handleDelete(selected)} activeOpacity={0.8}>
                <Text style={[styles.actionBtnText, { color: COLORS.error }]}>🗑 Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Internships Tab ───────────────────────────────────────────
function InternshipsTab() {
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');

  const load = async () => {
    try { setPosts(await fetchCollection('internships')); }
    catch { setPosts([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = (post) => {
    Alert.alert('Remove posting', `Remove "${post.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: async () => {
          await deleteDocument('internships', post.id);
          setPosts((p) => p.filter((i) => i.id !== post.id));
          Alert.alert('Removed', 'Internship posting removed.');
        }},
      ]
    );
  };

  const handleToggleStatus = async (post) => {
    const newStatus = post.status === 'Active' ? 'Closed' : 'Active';
    await updateField('internships', post.id, 'status', newStatus);
    setPosts((p) => p.map((i) => i.id === post.id ? { ...i, status: newStatus } : i));
  };

  const filtered = posts.filter((p) =>
    !search ||
    (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.company || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Search internships..."
          placeholderTextColor={COLORS.textHint} value={search} onChangeText={setSearch} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={COLORS.gold} colors={[COLORS.gold]} />
        }>
        {loading ? (
          <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>{search ? 'No results' : 'No internships posted'}</Text>
          </View>
        ) : (
          filtered.map((p) => (
            <View key={p.id} style={styles.listCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listName} numberOfLines={1}>{p.title}</Text>
                <Text style={styles.listSub}>{p.company || 'Unknown company'}</Text>
                <View style={styles.postMeta}>
                  {p.duration ? <Text style={styles.listMeta}>⏱ {p.duration}</Text> : null}
                  {p.stipend  ? <Text style={styles.listMeta}>💰 {p.stipend}</Text>  : null}
                </View>
              </View>
              <View style={styles.postActions}>
                <View style={[styles.verifyBadge,
                  { backgroundColor: p.status === 'Active' ? '#0A1F0A' : '#1A1A2E',
                    borderColor: p.status === 'Active' ? COLORS.success : COLORS.textSec }]}>
                  <Text style={{ fontSize: 11, fontWeight: '600',
                    color: p.status === 'Active' ? COLORS.success : COLORS.textSec }}>
                    {p.status || 'Active'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.iconBtn}
                  onPress={() => handleToggleStatus(p)} activeOpacity={0.8}>
                  <Text style={styles.iconBtnText}>
                    {p.status === 'Active' ? '⏸' : '▶️'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}
                  onPress={() => handleDelete(p)} activeOpacity={0.8}>
                  <Text style={styles.iconBtnText}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ── Reports Tab ───────────────────────────────────────────────
function ReportsTab() {
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { setReports(await fetchCollection('reports')); }
    catch { setReports([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const handleResolve = async (report) => {
    await updateField('reports', report.id, 'status', 'Resolved');
    setReports((p) => p.map((r) => r.id === report.id ? { ...r, status: 'Resolved' } : r));
    Alert.alert('Resolved', 'Report marked as resolved.');
  };

  const handleDismiss = async (report) => {
    await deleteDocument('reports', report.id);
    setReports((p) => p.filter((r) => r.id !== report.id));
    Alert.alert('Dismissed', 'Report dismissed.');
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
      refreshControl={
        <RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={COLORS.gold} colors={[COLORS.gold]} />
      }>
      <View style={styles.section}>
        {loading ? (
          <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
        ) : reports.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>No reports</Text>
            <Text style={styles.emptySub}>The platform is running smoothly!</Text>
          </View>
        ) : (
          reports.map((r) => (
            <View key={r.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportType}>{r.type || 'General'}</Text>
                <View style={[styles.verifyBadge,
                  { backgroundColor: r.status === 'Resolved' ? '#0A1F0A' : '#1F0F0F',
                    borderColor: r.status === 'Resolved' ? COLORS.success : COLORS.error }]}>
                  <Text style={{ fontSize: 11, fontWeight: '600',
                    color: r.status === 'Resolved' ? COLORS.success : COLORS.error }}>
                    {r.status || 'Open'}
                  </Text>
                </View>
              </View>
              <Text style={styles.reportDesc}>{r.description || 'No description'}</Text>
              <Text style={styles.reportMeta}>
                Reported by: {r.reportedBy || 'Anonymous'} · {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : ''}
              </Text>
              {r.status !== 'Resolved' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.success }]}
                    onPress={() => handleResolve(r)} activeOpacity={0.8}>
                    <Text style={[styles.actionBtnText, { color: COLORS.success }]}>✅ Resolve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.textSec }]}
                    onPress={() => handleDismiss(r)} activeOpacity={0.8}>
                    <Text style={[styles.actionBtnText, { color: COLORS.textSec }]}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab]   = useState('dashboard');
  const [stats, setStats]           = useState({
    students: 0, businesses: 0, internships: 0,
    applications: 0, verified: 0, unverified: 0, active: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const [students, businesses, internships, applications] = await Promise.all([
        fetchCollection('students'),
        fetchCollection('businesses'),
        fetchCollection('internships'),
        fetchCollection('applications'),
      ]);
      setStats({
        students:     students.length,
        businesses:   businesses.length,
        internships:  internships.length,
        applications: applications.length,
        verified:     businesses.filter((b) => b.verified === true || b.verified === 'true').length,
        unverified:   businesses.filter((b) => !b.verified || b.verified === 'false').length,
        active:       internships.filter((i) => i.status === 'Active').length,
      });
    } catch {}
    finally { setLoadingStats(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadStats(); }, []);

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':   return <DashboardTab stats={stats} loading={loadingStats} refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} />;
      case 'students':    return <StudentsTab />;
      case 'businesses':  return <BusinessesTab />;
      case 'internships': return <InternshipsTab />;
      case 'reports':     return <ReportsTab />;
      default:            return null;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topGreeting}>Admin Panel 🛡️</Text>
          <Text style={styles.topName}>{user?.name || 'Administrator'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn}
          onPress={() => Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: onLogout },
          ])} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: SPACING.lg }}>
        {renderTab()}
      </View>

      {/* Bottom nav */}
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
  topBar:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, paddingTop: 12, paddingHorizontal: 20, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  topGreeting:        { fontSize: 12, color: COLORS.textSec },
  topName:            { fontSize: 18, fontWeight: '700', color: COLORS.textPri },
  logoutBtn:          { backgroundColor: COLORS.card, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 7 },
  logoutText:         { fontSize: 13, color: COLORS.error },
  tabTitle:           { fontSize: 18, fontWeight: '700', color: COLORS.textPri, marginBottom: SPACING.md, marginTop: SPACING.sm },
  statsGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard:           { width: '47%', backgroundColor: COLORS.card, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center' },
  statEmoji:          { fontSize: 22, marginBottom: 6 },
  statValue:          { fontSize: 28, fontWeight: '700', color: COLORS.textPri },
  statLabel:          { fontSize: 11, color: COLORS.textSec, marginTop: 2 },
  section:            { marginBottom: SPACING.lg },
  sectionTitle:       { fontSize: 16, fontWeight: '700', color: COLORS.textPri, marginBottom: SPACING.md },
  activityRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
  activityEmoji:      { fontSize: 18, marginRight: SPACING.sm },
  activityLabel:      { flex: 1, fontSize: 14, color: COLORS.textPri },
  activityValue:      { fontSize: 16, fontWeight: '700', color: COLORS.gold },
  aiCard:             { backgroundColor: '#0A1020', borderWidth: 0.5, borderColor: '#1A3050', borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg },
  aiTitle:            { fontSize: 15, fontWeight: '700', color: '#6FB3F5', marginBottom: 4 },
  aiSub:              { fontSize: 12, color: COLORS.success, marginBottom: SPACING.md },
  aiRow:              { flexDirection: 'row', gap: SPACING.md },
  aiStat:             { flex: 1, alignItems: 'center' },
  aiStatVal:          { fontSize: 22, fontWeight: '700', color: COLORS.textPri },
  aiStatLabel:        { fontSize: 10, color: COLORS.textSec, textAlign: 'center', marginTop: 2 },
  searchBar:          { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 10, marginBottom: SPACING.md },
  searchIcon:         { fontSize: 15, marginRight: SPACING.sm },
  searchInput:        { flex: 1, fontSize: 14, color: COLORS.textPri },
  listCard:           { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
  listAvatar:         { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  listAvatarText:     { fontSize: 18, fontWeight: '700', color: COLORS.bg },
  listName:           { fontSize: 14, fontWeight: '600', color: COLORS.textPri },
  listSub:            { fontSize: 12, color: COLORS.textSec, marginTop: 2 },
  listMeta:           { fontSize: 11, color: COLORS.textHint, marginTop: 2 },
  postMeta:           { flexDirection: 'row', gap: SPACING.sm, marginTop: 4 },
  postActions:        { alignItems: 'flex-end', gap: 6 },
  completionBadge:    { backgroundColor: '#1A1608', borderWidth: 0.5, borderColor: COLORS.goldDark, borderRadius: RADIUS.md, paddingHorizontal: 8, paddingVertical: 4 },
  completionText:     { fontSize: 12, fontWeight: '600', color: COLORS.gold },
  verifyBadge:        { borderWidth: 0.5, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 4 },
  iconBtn:            { padding: 4 },
  iconBtnText:        { fontSize: 16 },
  emptyBox:           { alignItems: 'center', paddingTop: 60 },
  emptyEmoji:         { fontSize: 48, marginBottom: 12 },
  emptyTitle:         { fontSize: 16, fontWeight: '600', color: COLORS.textPri, marginBottom: 4 },
  emptySub:           { fontSize: 13, color: COLORS.textSec },
  // Detail sheet
  detailOverlay:      { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  detailBg:           { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  detailSheet:        { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, paddingBottom: 24, marginBottom: 70 },
  detailHeader:       { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg, paddingBottom: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  detailAvatar:       { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  detailAvatarText:   { fontSize: 20, fontWeight: '700', color: COLORS.bg },
  detailName:         { fontSize: 16, fontWeight: '700', color: COLORS.textPri },
  detailEmail:        { fontSize: 12, color: COLORS.textSec, marginTop: 2 },
  closeBtn:           { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  closeBtnText:       { fontSize: 14, color: COLORS.textSec },
  detailRow:          { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.sm, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  detailRowLabel:     { fontSize: 13, color: COLORS.textSec },
  detailRowValue:     { fontSize: 13, fontWeight: '600', color: COLORS.textPri, flex: 1, textAlign: 'right' },
  deleteBtn:          { backgroundColor: '#1F0A0A', borderWidth: 0.5, borderColor: COLORS.error, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center', marginTop: SPACING.md },
  deleteBtnText:      { fontSize: 14, color: COLORS.error, fontWeight: '600' },
  actionRow:          { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  actionBtn:          { flex: 1, borderWidth: 0.5, borderRadius: RADIUS.md, paddingVertical: 10, alignItems: 'center' },
  actionBtnText:      { fontSize: 13, fontWeight: '600' },
  reportCard:         { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
  reportHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  reportType:         { fontSize: 14, fontWeight: '600', color: COLORS.textPri },
  reportDesc:         { fontSize: 13, color: COLORS.textSec, lineHeight: 20, marginBottom: SPACING.sm },
  reportMeta:         { fontSize: 11, color: COLORS.textHint },
  bottomNav:          { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: COLORS.card, borderTopWidth: 0.5, borderTopColor: COLORS.border, paddingBottom: 20, paddingTop: SPACING.sm },
  navTab:             { flex: 1, alignItems: 'center', gap: 3 },
  navEmoji:           { fontSize: 18 },
  navLabel:           { fontSize: 9, color: COLORS.textSec },
  navLabelActive:     { color: COLORS.gold, fontWeight: '600' },
  navDot:             { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.gold },
});