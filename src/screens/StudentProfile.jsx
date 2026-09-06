import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../theme';
import { API_KEY, DB_URL } from '../config/Firebase';
import * as DocumentPicker from 'expo-document-picker';

const SKILL_OPTIONS = [
  'React Native','JavaScript','Python','Figma','UI/UX','Java',
  'Node.js','SQL','Excel','Content Writing','Data Analysis','Graphic Design',
  'HTML/CSS','TypeScript','Flutter','Machine Learning',
];

// ── Load profile from Firestore ────────────────────────────────
const loadProfile = async (uid) => {
  const res  = await fetch(`${DB_URL}/students/${uid}?key=${API_KEY}`);
  if (!res.ok) return null;
  const data = await res.json();
  const f    = data.fields || {};
  return {
    name:        f.name?.stringValue     || '',
    college:     f.college?.stringValue  || '',
    course:      f.course?.stringValue   || '',
    bio:         f.bio?.stringValue      || '',
    skills:      f.skills?.stringValue   ? f.skills.stringValue.split(',').filter(Boolean) : [],
    resumeUrl:   f.resumeUrl?.stringValue || '',
    phone:       f.phone?.stringValue    || '',
    linkedin:    f.linkedin?.stringValue || '',
    profileComplete: f.profileComplete?.integerValue || 10,
  };
};

// ── Save profile to Firestore ──────────────────────────────────
const saveProfile = async (uid, data) => {
  const complete = calculateComplete(data);
  const fields = {
    name:            { stringValue:  data.name     || '' },
    college:         { stringValue:  data.college  || '' },
    course:          { stringValue:  data.course   || '' },
    bio:             { stringValue:  data.bio      || '' },
    skills:          { stringValue:  data.skills.join(',') },
    phone:           { stringValue:  data.phone    || '' },
    linkedin:        { stringValue:  data.linkedin || '' },
    resumeUrl:       { stringValue:  data.resumeUrl || '' },
    profileComplete: { integerValue: complete },
    updatedAt:       { stringValue:  new Date().toISOString() },
  };
  const res = await fetch(`${DB_URL}/students/${uid}?key=${API_KEY}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error('Save failed');
  return complete;
};

const calculateComplete = (data) => {
  let score = 10;
  if (data.name)              score += 15;
  if (data.college)           score += 15;
  if (data.course)            score += 15;
  if (data.bio)               score += 15;
  if (data.skills?.length > 0) score += 15;
  if (data.phone)             score += 5;
  if (data.linkedin)          score += 5;
  if (data.resumeUrl)         score += 5;
  return Math.min(score, 100);
};

export default function StudentProfile({ user, onBack }) {
  const [name, setName]         = useState(user?.name  || '');
  const [college, setCollege]   = useState('');
  const [course, setCourse]     = useState('');
  const [bio, setBio]           = useState('');
  const [skills, setSkills]     = useState([]);
  const [phone, setPhone]       = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [resumeUrl, setResume]  = useState('');
  const [resumeUri, setResumeUri] = useState('');
  const [completion, setCompletion] = useState(10);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  // ── Load saved profile on mount ──────────────────────────────
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) { setLoading(false); return; }
    loadProfile(uid).then((profile) => {
      if (profile) {
        setName(profile.name       || user?.name || '');
        setCollege(profile.college || '');
        setCourse(profile.course   || '');
        setBio(profile.bio         || '');
        setSkills(profile.skills   || []);
        setPhone(profile.phone     || '');
        setLinkedin(profile.linkedin || '');
        setResume(profile.resumeUrl  || '');
        setCompletion(profile.profileComplete || 10);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const toggleSkill = (skill) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
    setSaved(false);
  };

  const handleSave = async () => {
    const uid = user?.uid;
    if (!uid)         { Alert.alert('Error', 'You are not logged in.'); return; }
    if (!name.trim()) { Alert.alert('Required', 'Name is required.');   return; }

    setSaving(true);
    try {
      const complete = await saveProfile(uid, {
        name, college, course, bio, skills, phone, linkedin, resumeUrl,
      });
      setCompletion(complete);
      setSaved(true);
      Alert.alert('Saved!', 'Your profile has been updated.');
    } catch {
      Alert.alert('Error', 'Failed to save profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      // Store file name as the resume reference
      setResume(file.name);
      setResumeUri(file.uri);
      setSaved(false);
      Alert.alert('Resume selected!', `"${file.name}" is ready. Tap Save to update your profile.`);
    } catch (e) {
      Alert.alert('Error', 'Could not open file picker. Try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator color={COLORS.gold} size="large" style={{ flex: 1 }} />
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
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.7}>
          {saving
            ? <ActivityIndicator color={COLORS.gold} size="small" />
            : <Text style={styles.saveLink}>{saved ? '✅ Saved' : 'Save'}</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>

        {/* Avatar + completion */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(name || 'S').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.displayName}>{name || 'Your Name'}</Text>
          <Text style={styles.displaySub}>{college || 'Your College'}</Text>

          <View style={styles.progressWrap}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Profile completion</Text>
              <Text style={styles.progressValue}>{completion}%</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${completion}%` }]} />
            </View>
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basic Information</Text>

          <Text style={styles.label}>Full name *</Text>
          <TextInput style={styles.input} placeholder="Your full name"
            placeholderTextColor={COLORS.textHint} value={name}
            onChangeText={(t) => { setName(t); setSaved(false); }} autoCapitalize="words" />

          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} placeholder="+91 98765 43210"
            placeholderTextColor={COLORS.textHint} value={phone}
            onChangeText={(t) => { setPhone(t); setSaved(false); }} keyboardType="phone-pad" />

          <Text style={styles.label}>College / University</Text>
          <TextInput style={styles.input} placeholder="KLE Technological University"
            placeholderTextColor={COLORS.textHint} value={college}
            onChangeText={(t) => { setCollege(t); setSaved(false); }} autoCapitalize="words" />

          <Text style={styles.label}>Course / Degree</Text>
          <TextInput style={styles.input} placeholder="B.Tech Computer Science"
            placeholderTextColor={COLORS.textHint} value={course}
            onChangeText={(t) => { setCourse(t); setSaved(false); }} autoCapitalize="words" />

          <Text style={styles.label}>LinkedIn</Text>
          <TextInput style={styles.input} placeholder="linkedin.com/in/yourname"
            placeholderTextColor={COLORS.textHint} value={linkedin}
            onChangeText={(t) => { setLinkedin(t); setSaved(false); }} autoCapitalize="none" />

          <Text style={styles.label}>Bio</Text>
          <TextInput style={[styles.input, styles.textArea]}
            placeholder="Tell businesses about yourself..."
            placeholderTextColor={COLORS.textHint} value={bio}
            onChangeText={(t) => { setBio(t); setSaved(false); }}
            multiline numberOfLines={3} textAlignVertical="top" />
        </View>

        {/* Skills */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Skills</Text>
          <Text style={styles.skillsHint}>Tap to select · {skills.length} selected</Text>
          <View style={styles.skillsGrid}>
            {SKILL_OPTIONS.map((s) => (
              <TouchableOpacity key={s}
                style={[styles.skillChip, skills.includes(s) && styles.skillChipActive]}
                onPress={() => toggleSkill(s)} activeOpacity={0.8}>
                <Text style={[styles.skillChipText, skills.includes(s) && styles.skillChipTextActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Resume */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resume</Text>
          {resumeUrl ? (
            <View style={styles.resumeUploaded}>
              <Text style={styles.resumeIcon}>📄</Text>
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={styles.resumeUploadedTitle}>✅ PDF uploaded</Text>
                <Text style={styles.resumeUploadedUrl} numberOfLines={1}>{resumeUrl}</Text>
              </View>
              <TouchableOpacity onPress={() => { setResume(''); setResumeUri(''); setSaved(false); }}>
                <Text style={styles.removeResume}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.resumeBtn} onPress={handleResumeUpload} activeOpacity={0.8}>
              <View style={styles.resumeIconWrap}>
                <Text style={styles.resumeIcon}>📄</Text>
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={styles.resumeBtnTitle}>Upload PDF Resume</Text>
                <Text style={styles.resumeBtnSub}>Tap to browse and select a PDF from your device</Text>
              </View>
              <Text style={styles.resumeArrow}>›</Text>
            </TouchableOpacity>
          )}
          {resumeUrl ? (
            <TouchableOpacity style={styles.reuploadBtn} onPress={handleResumeUpload} activeOpacity={0.8}>
              <Text style={styles.reuploadText}>Replace PDF</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtnFull, saving && { opacity: 0.7 }]}
          onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          {saving
            ? <ActivityIndicator color={COLORS.bg} />
            : <Text style={styles.saveBtnText}>{saved ? '✅ Profile Saved' : 'Save Profile'}</Text>}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:                { flex: 1, backgroundColor: COLORS.bg },
 header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, paddingTop: 40, paddingHorizontal: 20 },
  back:                { fontSize: 16, color: COLORS.gold, minWidth: 50 },
  headerTitle:         { fontSize: 16, fontWeight: '600', color: COLORS.textPri },
  saveLink:            { fontSize: 15, color: COLORS.gold, fontWeight: '600', minWidth: 50, textAlign: 'right' },
  scroll:              { paddingBottom: 40 },
  avatarSection:       { alignItems: 'center', paddingVertical: SPACING.lg, paddingHorizontal: SPACING.lg },
  avatar:              { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  avatarText:          { fontSize: 32, fontWeight: '700', color: COLORS.bg },
  displayName:         { fontSize: 20, fontWeight: '700', color: COLORS.textPri, marginBottom: 4 },
  displaySub:          { fontSize: 13, color: COLORS.textSec, marginBottom: SPACING.md },
  progressWrap:        { width: '100%' },
  progressRow:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel:       { fontSize: 12, color: COLORS.textSec },
  progressValue:       { fontSize: 12, color: COLORS.gold, fontWeight: '600' },
  progressBg:          { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  progressFill:        { height: 6, backgroundColor: COLORS.gold, borderRadius: 3 },
  card:                { backgroundColor: COLORS.card, borderRadius: RADIUS.xl, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.lg, marginHorizontal: SPACING.lg, marginBottom: SPACING.md },
  cardTitle:           { fontSize: 16, fontWeight: '700', color: COLORS.textPri, marginBottom: SPACING.md },
  label:               { fontSize: 12, color: COLORS.textSec, marginBottom: 8, letterSpacing: 0.4 },
  input:               { backgroundColor: COLORS.bg, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 14, fontSize: 15, color: COLORS.textPri, marginBottom: SPACING.md },
  textArea:            { height: 90, paddingTop: 14 },
  skillsHint:          { fontSize: 12, color: COLORS.textSec, marginBottom: SPACING.sm },
  skillsGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  skillChip:           { backgroundColor: COLORS.bg, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 8 },
  skillChipActive:     { backgroundColor: '#1A1608', borderColor: COLORS.gold },
  skillChipText:       { fontSize: 13, color: COLORS.textSec },
  skillChipTextActive: { color: COLORS.gold, fontWeight: '600' },
  resumeBtn:           { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md },
  resumeUploaded:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A1F0A', borderWidth: 0.5, borderColor: COLORS.success, borderRadius: RADIUS.md, padding: SPACING.md },
  resumeIcon:          { fontSize: 24 },
  resumeBtnTitle:      { fontSize: 14, fontWeight: '600', color: COLORS.textPri },
  resumeBtnSub:        { fontSize: 12, color: COLORS.textSec, marginTop: 2 },
  resumeArrow:         { fontSize: 22, color: COLORS.gold },
  resumeUploadedTitle: { fontSize: 14, fontWeight: '600', color: COLORS.success },
  resumeUploadedUrl:   { fontSize: 11, color: COLORS.textSec, marginTop: 2 },
  removeResume:        { fontSize: 16, color: COLORS.error, padding: 4 },
  resumeIconWrap:      { width: 44, height: 44, backgroundColor: '#0F1E30', borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  reuploadBtn:         { marginTop: SPACING.sm, alignSelf: 'flex-start', borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 7 },
  reuploadText:        { fontSize: 13, color: COLORS.textSec },
  saveBtnFull:         { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: 'center', marginHorizontal: SPACING.lg, marginTop: SPACING.sm },
  saveBtnText:         { color: COLORS.bg, fontSize: 15, fontWeight: '700' },
});