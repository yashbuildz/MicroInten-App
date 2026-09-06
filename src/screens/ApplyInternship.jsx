import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../theme';
import { API_KEY, DB_URL } from '../config/Firebase';

export default function ApplyInternship({ internship, user, onBack, onApplied }) {

  const [coverLetter, setCoverLetter] = useState('');
  const [phone, setPhone]             = useState('');
  const [linkedin, setLinkedin]       = useState('');
  const [portfolio, setPortfolio]     = useState('');
  const [whyUs, setWhyUs]             = useState('');
  const [experience, setExperience]   = useState('');
  const [availability, setAvail]      = useState('');
  const [loading, setLoading]         = useState(false);
  const [step, setStep]               = useState(1); // 1 = internship details, 2 = application form, 3 = success

  // ── Submit application to Firestore ────────────────────────
 const handleSubmit = async () => {
  if (!phone.trim()) {
    Alert.alert('Required', 'Please enter your phone number.');
    return;
  }

  if (!coverLetter.trim()) {
    Alert.alert('Required', 'Please write a cover letter.');
    return;
  }

  if (!whyUs.trim()) {
    Alert.alert('Required', 'Please answer why you want this internship.');
    return;
  }

  setLoading(true);

  try {
    const docId = `app_${Date.now()}`;

    // Save application
    const applicationFields = {
      studentId: { stringValue: user?.uid || "" },
      studentName: { stringValue: user?.name || "" },
      studentEmail: { stringValue: user?.email || "" },

     internshipId: { stringValue: internship?.id || "" },
      internshipTitle: { stringValue: internship.title },
      company:         { stringValue: internship.company },

      phone:           { stringValue: phone },
      linkedin:        { stringValue: linkedin },
      portfolio:       { stringValue: portfolio },
      whyUs:           { stringValue: whyUs },
      experience:      { stringValue: experience },
      coverLetter:     { stringValue: coverLetter },
      availability:    { stringValue: availability },

      status:          { stringValue: "Applied" },
      appliedAt:       { stringValue: new Date().toISOString() },
    };

    const saveApplication = await fetch(
      `${DB_URL}/applications/${docId}?key=${API_KEY}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: applicationFields,
        }),
      }
    );

    if (!saveApplication.ok) {
      throw new Error("Application save failed");
    }

    // Update applicant count
    const currentApplicants = Number(internship.applicants || 0);

    await fetch(
      `${DB_URL}/internships/${internship.id}?updateMask.fieldPaths=applicants&key=${API_KEY}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            applicants: {
              integerValue: String(currentApplicants + 1),
            },
          },
        }),
      }
    );

    setStep(3);

    onApplied?.();

  } catch (err) {
    console.log(err);

    Alert.alert(
      "Error",
      "Unable to submit application."
    );
  } finally {
    setLoading(false);
  }
};

  // ── Step 3: Success screen ─────────────────────────────────
  // ── Step 3: Success screen ─────────────────────────────────
if (step === 3) {
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          padding: SPACING.lg,
          justifyContent: 'center',
          alignItems: 'center',
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 420,
            backgroundColor: COLORS.card,
            borderRadius: RADIUS.xl,
            borderWidth: 0.5,
            borderColor: COLORS.border,
            padding: SPACING.lg,
          }}
        >
          <View style={styles.successCircle}>
            <Text style={styles.successTick}>✓</Text>
          </View>

          <Text style={styles.successTitle}>
            Application Submitted!
          </Text>

          <Text style={styles.successSub}>
            Your application for{'\n'}
            <Text style={styles.successCompany}>{internship?.title}</Text>
            {'\n'}at{' '}
            <Text style={styles.successCompany}>{internship?.company}</Text>
            {'\n'}has been sent successfully.
          </Text>

          <View style={styles.successCard}>
            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>Applied</Text>
              </View>
            </View>

            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Applied on</Text>
              <Text style={styles.successRowValue}>
                {new Date().toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>

            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Duration</Text>
              <Text style={styles.successRowValue}>
                {internship?.duration || 'N/A'}
              </Text>
            </View>

            <View style={[styles.successRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.successRowLabel}>Stipend</Text>
              <Text style={styles.successRowValue}>
                {internship?.stipend || 'N/A'}
              </Text>
            </View>
          </View>

          <Text style={styles.successHint}>
            The business will review your application.{'\n'}
            You will be notified of any updates.
          </Text>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={onBack}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>
              Back to Dashboard
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

  // ── Step 1: Internship detail ──────────────────────────────
  const renderStep1 = () => (
    <View>
      {/* Company & title */}
      <View style={styles.jobCard}>
        <View style={styles.jobCardHeader}>
          <View style={styles.companyIcon}>
            <Text style={{ fontSize: 28 }}>🏢</Text>
          </View>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={styles.jobTitle}>{internship?.title || 'Internship'}</Text>
            <Text style={styles.jobCompany}>{internship?.company || 'Company'}</Text>
          </View>
        </View>

        {/* Meta */}
        <View style={styles.metaGrid}>
          {[
            { icon: '📍', label: 'Location',  value: internship?.location || 'Not specified' },
            { icon: '⏱',  label: 'Duration',  value: internship?.duration || 'N/A' },
            { icon: '💰', label: 'Stipend',   value: internship?.stipend  || 'Unpaid' },
            { icon: '📅', label: 'Start',     value: 'Immediate' },
          ].map((m) => (
            <View key={m.label} style={styles.metaItem}>
              <Text style={styles.metaIcon}>{m.icon}</Text>
              <Text style={styles.metaLabel}>{m.label}</Text>
              <Text style={styles.metaValue}>{m.value}</Text>
            </View>
          ))}
        </View>

        {/* Skills */}
        {internship?.skills ? (
          <View>
            <Text style={styles.subHeading}>Required Skills</Text>
            <View style={styles.skillsRow}>
              {internship.skills.split(',').map((s) => (
                <View key={s.trim()} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{s.trim()}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Description */}
        {internship?.description ? (
          <View>
            <Text style={styles.subHeading}>About the role</Text>
            <Text style={styles.description}>{internship.description}</Text>
          </View>
        ) : null}
      </View>

      {/* Apply CTA */}
      <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)} activeOpacity={0.85}>
        <Text style={styles.nextBtnText}>Apply for this internship →</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Step 2: Application form ───────────────────────────────
  const renderStep2 = () => (
    <View>
      {/* Applicant info banner */}
      <View style={styles.applicantBanner}>
        <View style={styles.applicantAvatar}>
          <Text style={styles.applicantAvatarText}>
            {(user?.name || 'S').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ marginLeft: SPACING.sm, flex: 1 }}>
          <Text style={styles.applicantName}>{user?.name || 'Student'}</Text>
          <Text style={styles.applicantEmail}>{user?.email || ''}</Text>
        </View>
        <View style={styles.applicantBadge}>
          <Text style={styles.applicantBadgeText}>Applicant</Text>
        </View>
      </View>

      {/* Form card */}
      <View style={styles.formCard}>
        <Text style={styles.formSection}>Contact Details</Text>

        <Text style={styles.label}>Phone number *</Text>
        <TextInput style={styles.input} placeholder="+91 98765 43210"
          placeholderTextColor={COLORS.textHint} value={phone}
          onChangeText={setPhone} keyboardType="phone-pad" returnKeyType="next" />

        <Text style={styles.label}>LinkedIn profile (optional)</Text>
        <TextInput style={styles.input} placeholder="linkedin.com/in/yourname"
          placeholderTextColor={COLORS.textHint} value={linkedin}
          onChangeText={setLinkedin} autoCapitalize="none" returnKeyType="next" />

        <Text style={styles.label}>Portfolio / GitHub (optional)</Text>
        <TextInput style={styles.input} placeholder="github.com/yourname"
          placeholderTextColor={COLORS.textHint} value={portfolio}
          onChangeText={setPortfolio} autoCapitalize="none" returnKeyType="next" />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formSection}>Your Application</Text>

        <Text style={styles.label}>Why do you want this internship? *</Text>
        <TextInput style={[styles.input, styles.textArea]}
          placeholder="Tell us why you're interested in this role and what excites you about it..."
          placeholderTextColor={COLORS.textHint} value={whyUs}
          onChangeText={setWhyUs} multiline numberOfLines={4} textAlignVertical="top" />

        <Text style={styles.label}>Relevant experience</Text>
        <TextInput style={[styles.input, styles.textArea]}
          placeholder="Describe any relevant projects, internships or coursework..."
          placeholderTextColor={COLORS.textHint} value={experience}
          onChangeText={setExperience} multiline numberOfLines={4} textAlignVertical="top" />

        <Text style={styles.label}>Cover letter *</Text>
        <TextInput style={[styles.input, styles.textAreaLg]}
          placeholder="Write a brief cover letter introducing yourself and why you're the right fit..."
          placeholderTextColor={COLORS.textHint} value={coverLetter}
          onChangeText={setCoverLetter} multiline numberOfLines={6} textAlignVertical="top" />

        <Text style={styles.label}>When can you start?</Text>
        <TextInput style={styles.input} placeholder="e.g. Immediately / After 15 June"
          placeholderTextColor={COLORS.textHint} value={availability}
          onChangeText={setAvail} returnKeyType="done" />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && { opacity: 0.7 }]}
        onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
        {loading
          ? <ActivityIndicator color={COLORS.bg} />
          : <Text style={styles.submitBtnText}>Submit Application</Text>}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        By submitting, you confirm that all information provided is accurate.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={step === 1 ? onBack : () => setStep(1)} activeOpacity={0.7}>
          <Text style={styles.back}>‹ {step === 1 ? 'Back' : 'Details'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 1 ? 'Internship Details' : 'Apply Now'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Step indicator */}
      <View style={styles.stepRow}>
        {['Details', 'Apply'].map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepCircle, step > i && styles.stepCircleDone, step === i + 1 && styles.stepCircleActive]}>
              <Text style={[styles.stepNum, (step > i || step === i + 1) && styles.stepNumActive]}>
                {step > i + 1 ? '✓' : i + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, step === i + 1 && styles.stepLabelActive]}>{s}</Text>
            {i < 1 && <View style={[styles.stepLine, step > 1 && styles.stepLineDone]} />}
          </View>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {step === 1 ? renderStep1() : renderStep2()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: COLORS.bg },
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  back:               { fontSize: 16, color: COLORS.gold, minWidth: 60 },
  headerTitle:        { fontSize: 16, fontWeight: '600', color: COLORS.textPri },

  // Step indicator
  stepRow:            { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  stepItem:           { flexDirection: 'row', alignItems: 'center' },
  stepCircle:         { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  stepCircleActive:   { borderColor: COLORS.gold, backgroundColor: COLORS.gold },
  stepCircleDone:     { borderColor: COLORS.goldDark, backgroundColor: '#1A1608' },
  stepNum:            { fontSize: 12, color: COLORS.textSec, fontWeight: '600' },
  stepNumActive:      { color: COLORS.bg },
  stepLabel:          { fontSize: 12, color: COLORS.textSec, marginLeft: 6 },
  stepLabelActive:    { color: COLORS.gold, fontWeight: '600' },
  stepLine:           { width: 40, height: 1.5, backgroundColor: COLORS.border, marginHorizontal: 8 },
  stepLineDone:       { backgroundColor: COLORS.gold },

  scroll:             { paddingHorizontal: SPACING.lg, paddingBottom: 40 },

  // Job card
  jobCard:            { backgroundColor: COLORS.card, borderRadius: RADIUS.xl, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.lg, marginBottom: SPACING.md },
  jobCardHeader:      { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  companyIcon:        { width: 60, height: 60, backgroundColor: '#0F1E30', borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  jobTitle:           { fontSize: 18, fontWeight: '700', color: COLORS.textPri, marginBottom: 4 },
  jobCompany:         { fontSize: 14, color: COLORS.textSec },
  metaGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  metaItem:           { width: '47%', backgroundColor: COLORS.bg, borderRadius: RADIUS.md, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.sm },
  metaIcon:           { fontSize: 16, marginBottom: 4 },
  metaLabel:          { fontSize: 10, color: COLORS.textSec, marginBottom: 2 },
  metaValue:          { fontSize: 13, fontWeight: '600', color: COLORS.textPri },
  subHeading:         { fontSize: 14, fontWeight: '600', color: COLORS.textPri, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  skillsRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.sm },
  skillChip:          { backgroundColor: '#0F1E30', borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5 },
  skillChipText:      { fontSize: 12, color: '#6FB3F5', fontWeight: '500' },
  description:        { fontSize: 13, color: COLORS.textSec, lineHeight: 20 },
  nextBtn:            { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center', marginBottom: SPACING.md },
  nextBtnText:        { color: COLORS.bg, fontSize: 15, fontWeight: '700' },

  // Application form
  applicantBanner:    { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.md },
  applicantAvatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  applicantAvatarText:{ fontSize: 18, fontWeight: '700', color: COLORS.bg },
  applicantName:      { fontSize: 15, fontWeight: '600', color: COLORS.textPri },
  applicantEmail:     { fontSize: 12, color: COLORS.textSec, marginTop: 2 },
  applicantBadge:     { backgroundColor: '#1A1608', borderWidth: 0.5, borderColor: COLORS.goldDark, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  applicantBadgeText: { fontSize: 11, color: COLORS.gold, fontWeight: '500' },
  formCard:           { backgroundColor: COLORS.card, borderRadius: RADIUS.xl, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.lg, marginBottom: SPACING.md },
  formSection:        { fontSize: 15, fontWeight: '700', color: COLORS.textPri, marginBottom: SPACING.md },
  label:              { fontSize: 12, color: COLORS.textSec, marginBottom: 8, letterSpacing: 0.4 },
  input:              { backgroundColor: COLORS.bg, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 14, fontSize: 15, color: COLORS.textPri, marginBottom: SPACING.md },
  textArea:           { height: 100, paddingTop: 14 },
  textAreaLg:         { height: 130, paddingTop: 14 },
  submitBtn:          { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center', marginBottom: SPACING.sm },
  submitBtnText:      { color: COLORS.bg, fontSize: 15, fontWeight: '700' },
  disclaimer:         { fontSize: 11, color: COLORS.textHint, textAlign: 'center', marginBottom: SPACING.lg, lineHeight: 18 },

  // Success screen
  successScreen:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  successCircle:      { width: 90, height: 90, borderRadius: 45, backgroundColor: '#0A1F0A', borderWidth: 2, borderColor: COLORS.success, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  successTick:        { fontSize: 40, color: COLORS.success },
  successTitle:       { fontSize: 24, fontWeight: '700', color: COLORS.textPri, marginBottom: SPACING.sm, textAlign: 'center' },
  successSub:         { fontSize: 14, color: COLORS.textSec, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.lg },
  successCompany:     { color: COLORS.gold, fontWeight: '600' },
  successCard:        { width: '100%', backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: COLORS.border, marginBottom: SPACING.lg, overflow: 'hidden' },
  successRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  successRowLabel:    { fontSize: 13, color: COLORS.textSec },
  successRowValue:    { fontSize: 13, fontWeight: '600', color: COLORS.textPri },
  statusBadge:        { backgroundColor: '#0A1A30', borderWidth: 0.5, borderColor: '#378ADD', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText:    { fontSize: 12, color: '#6FB3F5', fontWeight: '600' },
  successHint:        { fontSize: 12, color: COLORS.textSec, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.xl },
  doneBtn:            { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, paddingVertical: 15, paddingHorizontal: 48, alignItems: 'center' },
  doneBtnText:        { color: COLORS.bg, fontSize: 15, fontWeight: '700' },
});