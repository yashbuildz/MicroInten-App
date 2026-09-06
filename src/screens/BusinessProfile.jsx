import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../theme';
import { API_KEY, DB_URL } from '../config/Firebase';

const INDUSTRIES = [
  'Technology','Design','Marketing','Finance',
  'Education','Healthcare','Retail','Media','Other',
];

// fetch existing profile from Firestore
const fetchProfile = async (uid) => {
  const res  = await fetch(`${DB_URL}/businesses/${uid}?key=${API_KEY}`);
  const data = await res.json();
  if (!data.fields) return null;
  const f = data.fields;
  return {
    businessName: f.businessName?.stringValue || '',
    industry:     f.industry?.stringValue     || '',
    location:     f.location?.stringValue     || '',
    website:      f.website?.stringValue      || '',
    about:        f.about?.stringValue        || '',
    email:        f.email?.stringValue        || '',
    phone:        f.phone?.stringValue        || '',
    verified:     f.verified?.booleanValue    || false,
  };
};

export default function BusinessProfile({ user, onBack }) {
  const [bizName, setBizName]   = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite]   = useState('');
  const [about, setAbout]       = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [verified, setVerified] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [changed, setChanged]   = useState(false);

  // load real data from Firestore on mount
  useEffect(() => {
    if (!user?.uid) { setFetching(false); return; }
    fetchProfile(user.uid)
      .then((profile) => {
        if (profile) {
          setBizName(profile.businessName);
          setIndustry(profile.industry);
          setLocation(profile.location);
          setWebsite(profile.website);
          setAbout(profile.about);
          setEmail(profile.email || user.email || '');
          setPhone(profile.phone);
          setVerified(profile.verified);
        } else {
          // pre-fill email from registration
          setEmail(user.email || '');
          setBizName(user.name || '');
        }
      })
      .catch((e) => console.log('Fetch profile error:', e.message))
      .finally(() => setFetching(false));
  }, []);

  const mark = (setter) => (val) => { setter(val); setSaved(false); setChanged(true); };

  const handleSave = async () => {
    if (!bizName.trim()) { Alert.alert('Required', 'Business name is required.'); return; }
    if (!industry)       { Alert.alert('Required', 'Please select an industry.'); return; }

    setSaving(true);
    try {
      const uid    = user?.uid;
      if (!uid) throw new Error('Not logged in');

      const fields = {
        businessName: { stringValue: bizName.trim()   },
        industry:     { stringValue: industry         },
        location:     { stringValue: location.trim()  },
        website:      { stringValue: website.trim()   },
        about:        { stringValue: about.trim()     },
        email:        { stringValue: email.trim()     },
        phone:        { stringValue: phone.trim()     },
        verified:     { booleanValue: verified        },
        updatedAt:    { stringValue: new Date().toISOString() },
      };

      const res = await fetch(`${DB_URL}/businesses/${uid}?key=${API_KEY}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fields }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Save failed');
      }

      setSaved(true);
      setChanged(false);
      Alert.alert('Saved!', 'Your business profile has been updated.');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.gold} size="large" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
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
        <Text style={styles.headerTitle}>Company Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.7}>
          {saving
            ? <ActivityIndicator color={COLORS.gold} size="small" />
            : <Text style={[styles.saveLink, !changed && styles.saveLinkDim]}>
                {saved && !changed ? '✅ Saved' : 'Save'}
              </Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.bizAvatar}>
            <Text style={styles.bizAvatarEmoji}>🏢</Text>
          </View>
          <Text style={styles.bizNameDisplay}>{bizName || 'Your Company'}</Text>
          <Text style={styles.bizIndustryDisplay}>{industry || 'Select industry below'}</Text>
          {verified ? (
            <View style={[styles.badge, styles.badgeVerified]}>
              <Text style={styles.badgeVerifiedText}>✅ Verified Business</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.badgePending]}>
              <Text style={styles.badgePendingText}>⏳ Pending Verification</Text>
            </View>
          )}
        </View>

        {/* Basic info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Business Information</Text>

          <Text style={styles.label}>Business name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. PixelCraft Studio"
            placeholderTextColor={COLORS.textHint}
            value={bizName}
            onChangeText={mark(setBizName)}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Industry *</Text>
          <View style={styles.chipGrid}>
            {INDUSTRIES.map((ind) => (
              <TouchableOpacity
                key={ind}
                style={[styles.chip, industry === ind && styles.chipActive]}
                onPress={() => { setIndustry(ind); setSaved(false); setChanged(true); }}
                activeOpacity={0.8}>
                <Text style={[styles.chipText, industry === ind && styles.chipTextActive]}>
                  {ind}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Hubli, Karnataka"
            placeholderTextColor={COLORS.textHint}
            value={location}
            onChangeText={mark(setLocation)}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Website</Text>
          <TextInput
            style={styles.input}
            placeholder="https://yourcompany.com"
            placeholderTextColor={COLORS.textHint}
            value={website}
            onChangeText={mark(setWebsite)}
            autoCapitalize="none"
            keyboardType="url"
          />

          <Text style={styles.label}>About your company</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell students about your company, culture and what they'll learn..."
            placeholderTextColor={COLORS.textHint}
            value={about}
            onChangeText={mark(setAbout)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Contact */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Details</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="contact@company.com"
            placeholderTextColor={COLORS.textHint}
            value={email}
            onChangeText={mark(setEmail)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 98765 43210"
            placeholderTextColor={COLORS.textHint}
            value={phone}
            onChangeText={mark(setPhone)}
            keyboardType="phone-pad"
          />
        </View>

        {/* Verification note */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🛡️ Account Verification</Text>
          <Text style={styles.infoText}>
            Your business account needs admin verification before internships are publicly listed.
            This typically takes 1–2 business days after profile completion.
          </Text>
        </View>

        {/* Bottom spacer so content isn't hidden behind sticky button */}
        <View style={{ height: 100 }} />

      </ScrollView>

      {/* Sticky Save button always visible at bottom */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}>
          {saving
            ? <ActivityIndicator color={COLORS.bg} />
            : <Text style={styles.saveBtnText}>
                {saved && !changed ? '✅ Profile Saved' : 'Save Profile'}
              </Text>}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: COLORS.bg },
  loadingWrap:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText:        { fontSize: 14, color: COLORS.textSec },
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, paddingTop: 50, paddingHorizontal: 20, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  back:               { fontSize: 16, color: COLORS.gold, minWidth: 50 },
  headerTitle:        { fontSize: 16, fontWeight: '600', color: COLORS.textPri },
  saveLink:           { fontSize: 15, color: COLORS.gold, fontWeight: '600' },
  saveLinkDim:        { opacity: 0.5 },
  scroll:             { paddingBottom: 20 },
  avatarSection:      { alignItems: 'center', paddingVertical: SPACING.lg },
  bizAvatar:          { width: 80, height: 80, borderRadius: 20, backgroundColor: '#0F1E30', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm, borderWidth: 0.5, borderColor: COLORS.border },
  bizAvatarEmoji:     { fontSize: 36 },
  bizNameDisplay:     { fontSize: 20, fontWeight: '700', color: COLORS.textPri, marginBottom: 4, textAlign: 'center' },
  bizIndustryDisplay: { fontSize: 13, color: COLORS.textSec, marginBottom: SPACING.sm },
  badge:              { borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 0.5 },
  badgeVerified:      { backgroundColor: '#0A1F0A', borderColor: COLORS.success },
  badgeVerifiedText:  { fontSize: 12, color: COLORS.success, fontWeight: '500' },
  badgePending:       { backgroundColor: '#1F1700', borderColor: COLORS.warning },
  badgePendingText:   { fontSize: 12, color: COLORS.warning, fontWeight: '500' },
  card:               { backgroundColor: COLORS.card, borderRadius: RADIUS.xl, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.lg, marginHorizontal: SPACING.lg, marginBottom: SPACING.md },
  cardTitle:          { fontSize: 16, fontWeight: '700', color: COLORS.textPri, marginBottom: SPACING.md },
  label:              { fontSize: 12, color: COLORS.textSec, marginBottom: 8, letterSpacing: 0.4 },
  input:              { backgroundColor: COLORS.bg, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 14, fontSize: 15, color: COLORS.textPri, marginBottom: SPACING.md },
  textArea:           { height: 100, paddingTop: 14 },
  chipGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  chip:               { backgroundColor: COLORS.bg, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive:         { backgroundColor: '#1A1608', borderColor: COLORS.gold },
  chipText:           { fontSize: 13, color: COLORS.textSec },
  chipTextActive:     { color: COLORS.gold, fontWeight: '600' },
  infoBox:            { backgroundColor: '#0A1020', borderWidth: 0.5, borderColor: '#1A3050', borderRadius: RADIUS.lg, padding: SPACING.md, marginHorizontal: SPACING.lg, marginBottom: SPACING.md },
  infoTitle:          { fontSize: 14, fontWeight: '600', color: '#6FB3F5', marginBottom: 6 },
  infoText:           { fontSize: 13, color: COLORS.textSec, lineHeight: 20 },
  stickyFooter:       { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, paddingBottom: SPACING.lg, backgroundColor: COLORS.bg, borderTopWidth: 0.5, borderTopColor: COLORS.border },
  saveBtn:            { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: 'center' },
  saveBtnText:        { color: COLORS.bg, fontSize: 15, fontWeight: '700' },
});