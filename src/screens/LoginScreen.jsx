import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../theme';
import { loginUser } from '../services/AuthService';

export default function LoginScreen({ role = 'student', onBack, onLoginSuccess, onGoRegister }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const ROLE_EMOJI = { student: '🎓', business: '🏢', admin: '🛡️' };

  const handleLogin = async () => {
    setError('');
    if (!email.trim())    { setError('Enter your email address.'); return; }
    if (!password.trim()) { setError('Enter your password.'); return; }

    setLoading(true);
    try {
      const loggedInUser = await loginUser(email, password);

console.log("✅ User logged in:", loggedInUser);

onLoginSuccess && onLoginSuccess(loggedInUser);
    } catch (e) {
      const msg = {
        'auth/user-not-found':         'No account found with this email.',
        'auth/wrong-password':         'Incorrect password.',
        'auth/invalid-credential':     'Incorrect email or password.',
        'auth/invalid-email':          'Invalid email address.',
        'auth/too-many-requests':      'Too many attempts. Try again later.',
        'auth/network-request-failed': 'No internet connection.',
      }[e.code] || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>

          <View style={styles.logoWrap}>
            <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brandName}>MICRO<Text style={styles.brandAccent}>INTERNS</Text></Text>
            <Text style={styles.tagline}>LEARN. EARN. GROW.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{ROLE_EMOJI[role]}{'  '}{roleLabel} login</Text>
            </View>

            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>Sign in to continue</Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textHint}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passRow}>
                <TextInput
                  style={[styles.input, styles.passInput]}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textHint}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(''); }}
                  secureTextEntry={!showPass}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                  <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotWrap} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={COLORS.bg} />
                : <Text style={styles.loginBtnText}>Sign in as {roleLabel}</Text>
              }
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={onGoRegister} activeOpacity={0.7}>
                <Text style={styles.registerLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.bg },
  scroll:       { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg },
  backBtn:      { marginBottom: SPACING.sm },
  backText:     { fontSize: 16, color: COLORS.gold },
  logoWrap:     { alignItems: 'center', marginBottom: SPACING.xl },
  logo:         { width: 72, height: 72, marginBottom: SPACING.sm },
  brandName:    { fontSize: 18, fontWeight: '700', color: COLORS.textPri, letterSpacing: 5 },
  brandAccent:  { color: COLORS.gold },
  tagline:      { fontSize: 10, color: COLORS.textSec, letterSpacing: 3, marginTop: 4 },
  card:         { backgroundColor: COLORS.card, borderRadius: RADIUS.xl, borderWidth: 0.5, borderColor: COLORS.border, padding: SPACING.lg },
  roleBadge:    { alignSelf: 'flex-start', backgroundColor: '#1E1A0A', borderWidth: 0.5, borderColor: COLORS.goldDark, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 5, marginBottom: SPACING.md },
  roleBadgeText:{ fontSize: 12, color: COLORS.gold, fontWeight: '500' },
  heading:      { fontSize: 22, fontWeight: '700', color: COLORS.textPri, marginBottom: 4 },
  subheading:   { fontSize: 14, color: COLORS.textSec, marginBottom: SPACING.lg },
  fieldWrap:    { marginBottom: SPACING.md },
  label:        { fontSize: 12, color: COLORS.textSec, marginBottom: 8, letterSpacing: 0.4 },
  input:        { backgroundColor: COLORS.bg, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 14, fontSize: 15, color: COLORS.textPri },
  passRow:      { flexDirection: 'row', alignItems: 'center' },
  passInput:    { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 },
  eyeBtn:       { backgroundColor: COLORS.bg, borderWidth: 0.5, borderColor: COLORS.border, borderTopRightRadius: RADIUS.md, borderBottomRightRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 14 },
  eyeText:      { fontSize: 16 },
  forgotWrap:   { alignSelf: 'flex-end', marginBottom: SPACING.md, marginTop: 2 },
  forgotText:   { fontSize: 13, color: COLORS.gold },
  errorBox:     { backgroundColor: COLORS.errorBg, borderWidth: 0.5, borderColor: COLORS.errorBorder, borderRadius: RADIUS.sm, padding: SPACING.sm + 4, marginBottom: SPACING.md },
  errorText:    { fontSize: 13, color: COLORS.error },
  loginBtn:     { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: 'center', marginBottom: SPACING.lg },
  loginBtnText: { color: COLORS.bg, fontSize: 15, fontWeight: '700', letterSpacing: 0.4 },
  dividerRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  dividerLine:  { flex: 1, height: 0.5, backgroundColor: COLORS.border },
  dividerText:  { fontSize: 12, color: COLORS.textSec, marginHorizontal: SPACING.sm },
  registerRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { fontSize: 14, color: COLORS.textSec },
  registerLink: { fontSize: 14, color: COLORS.goldLight, fontWeight: '600' },
});